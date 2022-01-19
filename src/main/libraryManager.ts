import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

import { fatalErrorAndExit } from './utility';
import { isValidVocabularyEntry, WORD_DICTIONARY_EXTENSION, SENTENCE_DICTIONARY_EXTENSION, concatDictionaryFileName } from '../commonUtility';

export class LibraryManager {
  dictionaryMap: Map<string, Dictionary>;
  libraryDirPath: string;

  constructor() {
    this.dictionaryMap = new Map();
    this.libraryDirPath = path.join(app.getPath('userData'), 'vocabulary');
  }

  static async init(): Promise<LibraryManager> {
    const libraryManager = new LibraryManager();
    await libraryManager.initLibrary();

    return libraryManager;
  }

  getDictionaryList = (): CategorizedDictionaryInfoList => {
    const dictionaryInfoList: CategorizedDictionaryInfoList = {
      word: [],
      sentence: []
    };

    for (let dictionaryName of this.dictionaryMap.keys()) {
      const dictionary = this.dictionaryMap.get(dictionaryName) as Dictionary;

      const dictionaryInfo = {
        name: dictionary.name,
        type: dictionary.type,
        timestamp: dictionary.timestamp,
        errorLineList: dictionary.errorLineList,
        enable: dictionary.enable,
      };

      if (dictionary.type == 'word') {
        dictionaryInfoList.word.push(dictionaryInfo);
      } else {
        dictionaryInfoList.sentence.push(dictionaryInfo);
      }
    }

    return dictionaryInfoList;
  }

  getVocabularyEntryList = (usedDictionaryNameList: string[]): Array<VocabularyEntry> => {
    let vocabularyEntryList: Array<VocabularyEntry> = [];

    usedDictionaryNameList.forEach(dictionaryFileName => {
      if (this.dictionaryMap.has(dictionaryFileName)) {
        // キーを持っていることは確かめているのでキャストしてもよいはず
        vocabularyEntryList = vocabularyEntryList.concat((this.dictionaryMap.get(dictionaryFileName) as Dictionary).content);
      }
    });

    return vocabularyEntryList;
  }

  getDictionaryFileList = () => {
    let dictionaryFileList: string[];
    // userData配下のvocabularyにあるファイル一覧を取得する
    try {
      dictionaryFileList = fs.readdirSync(this.libraryDirPath);
    } catch (errOnLs) {
      // ディレクトリが無かったら作る
      try {
        fs.mkdirSync(this.libraryDirPath);
        dictionaryFileList = fs.readdirSync(this.libraryDirPath);
      } catch (errOnCreate) {
        dictionaryFileList = [];
        fatalErrorAndExit(errOnCreate as Error);
      }
    }

    return dictionaryFileList.filter(dictionaryFileName => {
      const extension = path.extname(dictionaryFileName);

      return extension === WORD_DICTIONARY_EXTENSION || extension === SENTENCE_DICTIONARY_EXTENSION;
    });
  }

  initLibrary = async (): Promise<void> => {
    const dictionaryFileList = this.getDictionaryFileList();

    const dictionaryPromiseList: Promise<Dictionary>[] = [];

    dictionaryFileList.forEach(dictionaryFileName => {
      const filePath = path.join(this.libraryDirPath, dictionaryFileName);

      dictionaryPromiseList.push(this.initDictionary(filePath));
    });

    await Promise.allSettled(dictionaryPromiseList).then(result => {
      result.forEach(result => {
        if (result.status === 'fulfilled') {
          const dictionary = result.value;
          const key = concatDictionaryFileName(dictionary);

          this.dictionaryMap.set(key, dictionary);
        } else {
          // TODO ユーザーに知らせる
          console.error(result.reason);
        }
      });
    });
  }

  reloadLibrary = async (): Promise<void> => {
    const dictionaryFileList = this.getDictionaryFileList();
    const oldMap = this.dictionaryMap;

    this.dictionaryMap = new Map();
    const dictionaryPromiseList: Promise<Dictionary>[] = [];

    dictionaryFileList.forEach(dictionaryFileName => {
      const filePath = path.join(this.libraryDirPath, dictionaryFileName);

      // キャッシュされていなかったファイルのみ新たにパースする
      if (oldMap.has(dictionaryFileName) && this.isSameTimestamp(filePath, (oldMap.get(dictionaryFileName) as Dictionary))) {
        this.dictionaryMap.set(dictionaryFileName, oldMap.get(dictionaryFileName) as Dictionary);
      } else {
        dictionaryPromiseList.push(this.initDictionary(filePath));
      }
    });

    // FIXME initDictionaryにも同じロジックがあった
    await Promise.allSettled(dictionaryPromiseList).then(result => {
      result.forEach(result => {
        if (result.status === 'fulfilled') {
          const dictionary = result.value;
          const key = concatDictionaryFileName(dictionary);

          this.dictionaryMap.set(key, dictionary);
        } else {
          // TODO ユーザーに知らせる
          console.error(result.reason);
        }
      });
    });
  }

  isSameTimestamp = (filePath: string, dictionary: Dictionary): boolean => {
    try {
      return fs.statSync(filePath).mtimeMs === dictionary.timestamp;
    } catch (e) {
      // 何らかのエラーがあったらタイムスタンプが異なるとみなす
      return false;
    }
  }

  initDictionary = (filePath: string): Promise<Dictionary> => {
    const extension = path.extname(filePath);
    // TODO プラットフォームによっては正しく切り出せないかもしれない
    const dictionaryName = path.basename(filePath, extension);

    return fsPromises.readFile(filePath, { encoding: 'utf-8' }).then((content: string) => {

      return fsPromises.stat(filePath).then(stat => {
        let dictionaryContent: DictionaryContent;
        let errorLineList: number[];

        if (extension === WORD_DICTIONARY_EXTENSION) {
          [dictionaryContent, errorLineList] = this.parseWordDictionary(content);
        } else {
          [dictionaryContent, errorLineList] = this.parseSentenceDictionary(content);
        }

        return {
          name: dictionaryName,
          type: extension === WORD_DICTIONARY_EXTENSION ? 'word' : 'sentence',
          enable: dictionaryContent.length != 0,
          timestamp: stat.mtimeMs,
          errorLineList: errorLineList,
          content: dictionaryContent,
        };
      });
    });
  }

  parseWordDictionary = (content: string): [DictionaryContent, number[]] => {
    const vocabularyList: DictionaryContent = [];
    const errorLineList: number[] = [];

    // それぞれの行は以下のようなフォーマットに従う
    // 漢字:かん,じ
    const lineRegExp = /^[^:]+:[^,]+(,[^,])*/;

    content.split(/\r\n|\n/).forEach((line, i) => {
      if (lineRegExp.test(line)) {
        const viewString = line.split(':')[0];
        const hiraganaString = line.split(':')[1].split(',');

        if (isValidVocabularyEntry(viewString, hiraganaString)) {
          vocabularyList.push([viewString, hiraganaString]);
        } else {
          errorLineList.push(i + 1);
        }

      } else {
        if (line != '') {
          errorLineList.push(i + 1);
        }
      }
    });

    return [vocabularyList, errorLineList];
  }

  parseSentenceDictionary = (content: string): [DictionaryContent, number[]] => {
    const vocabularyList: DictionaryContent = [];
    const errorLineList: number[] = [];

    // 空行があると奇数行と偶数行が入れ替わるのでなくす
    const contentLineList = content.split(/\r\n|\n/).filter(line => line !== '');

    for (let i = 0; i < contentLineList.length; i += 2) {
      const viewStr = contentLineList[i];
      const hiraganaStr = contentLineList[i + 1] ? contentLineList[i + 1] : '';

      // 読みの区切り文字はカンマだが文章中にカンマが出てきた場合にも対処する
      // Ex. 「はい,いいえ」という表示文には「は,い,,,い,い,え」という読みが対応する
      // 「,,,」の１つ目・３つ目のカンマは区切り文字だが２つ目は文字としてのカンマ
      const hiraganaElementList: string[] = [];
      let isPrevDelimiterComma = false;
      let tmpHiragana = '';

      for (let j = 0; j < hiraganaStr.length; ++j) {
        // 直前が区切り文字としてのカンマだった場合には必ず文字列に追加する
        if (isPrevDelimiterComma) {
          tmpHiragana += hiraganaStr[j];
          isPrevDelimiterComma = false;

        } else {
          // 直前が区切りではない場合にはカンマは区切り文字と考える
          if (hiraganaStr[j] == ',') {
            isPrevDelimiterComma = true;
            hiraganaElementList.push(tmpHiragana);
            tmpHiragana = '';

          } else {
            tmpHiragana += hiraganaStr[j];
          }
        }
      }

      // 最後の読みを追加する
      hiraganaElementList.push(tmpHiragana);

      if (isValidVocabularyEntry(viewStr, hiraganaElementList)) {
        vocabularyList.push([viewStr, hiraganaElementList]);
      } else {
        // 無効な文書があった場合には奇数行（表示文）の行をエラーとする
        errorLineList.push(i + 1);
      }
    }

    return [vocabularyList, errorLineList];
  }
}
