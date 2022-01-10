import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

import { fatalErrorAndExit } from './utility';
import { isValidVocabulary, WORD_DICTIONARY_EXTENSION, SENTENCE_DICTIONARY_EXTENSION, concatDictionaryFileName } from '../commonUtility';

export class Vocabulary {
  dictionaryMap: Map<string, Dictionary>;

  constructor() {
    this.dictionaryMap = new Map();
  }

  static async init(): Promise<Vocabulary> {
    const vocabulary = new Vocabulary();
    await vocabulary.initVocabulary();

    return vocabulary;
  }

  getDictionaryList = (): Array<DictionaryInfo> => {
    const dictionaryInfoList: Array<DictionaryInfo> = [];

    for (let dictionaryName of this.dictionaryMap.keys()) {
      const dictionary = this.dictionaryMap.get(dictionaryName) as Dictionary;

      const dictionaryInfo = {
        name: dictionary.name,
        type: dictionary.type,
        errorLineList: dictionary.errorLineList,
        enable: dictionary.enable,
      };

      dictionaryInfoList.push(dictionaryInfo);
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
    const userDataPath = app.getPath('userData');
    const vocabularyDirPath = path.join(userDataPath, 'vocabulary');

    let dictionaryFileList: string[];
    // userData配下のvocabularyにあるファイル一覧を取得する
    try {
      dictionaryFileList = fs.readdirSync(vocabularyDirPath);
    } catch (errOnLs) {
      // ディレクトリが無かったら作る
      try {
        fs.mkdirSync(vocabularyDirPath);
        dictionaryFileList = fs.readdirSync(vocabularyDirPath);
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

  initVocabulary = async (): Promise<void> => {
    const vocabularyDirPath = path.join(app.getPath('userData'), 'vocabulary');

    const dictionaryFileList = this.getDictionaryFileList();

    const dictionaryPromiseList: Promise<Dictionary>[] = [];

    dictionaryFileList.forEach(dictionaryFileName => {
      const filePath = path.join(vocabularyDirPath, dictionaryFileName);

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

  reloadVocabulary = async (): Promise<void> => {
    const vocabularyDirPath = path.join(app.getPath('userData'), 'vocabulary');

    const dictionaryFileList = this.getDictionaryFileList();
    const oldMap = this.dictionaryMap;

    this.dictionaryMap = new Map();
    const dictionaryPromiseList: Promise<Dictionary>[] = [];

    dictionaryFileList.forEach(dictionaryFileName => {

      // キャッシュされていなかったファイルのみ新たにパースする
      // TODO タイムスタンプを用いて古くなったキャッシュを更新する
      if (oldMap.has(dictionaryFileName)) {
        this.dictionaryMap.set(dictionaryFileName, oldMap.get(dictionaryFileName) as Dictionary);
      } else {
        const filePath = path.join(vocabularyDirPath, dictionaryFileName);
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

  initDictionary = (filePath: string): Promise<Dictionary> => {
    const extension = path.extname(filePath);
    // TODO プラットフォームによっては正しく切り出せないかもしれない
    const dictionaryName = path.basename(filePath, extension);

    return fsPromises.readFile(filePath, { encoding: 'utf-8' }).then((content: string) => {
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
        errorLineList: errorLineList,
        content: dictionaryContent,
      };
    });
  }

  parseWordDictionary = (content: string): [DictionaryContent, number[]] => {
    const vocabularyList: DictionaryContent = [];
    const errorLineList: number[] = [];

    // それぞれの行は以下のようなフォーマットに従う
    // 漢字:かん,じ
    const lineRegExp = /^[^:]+:[^,]+(,[^,])*/;

    content.split(/\r\n|\n/).forEach((line, i) => {
      // TODO マッチしないものはユーザーに伝える
      if (lineRegExp.test(line)) {
        const viewString = line.split(':')[0];
        const hiraganaString = line.split(':')[1].split(',');

        if (isValidVocabulary(viewString, hiraganaString)) {
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

    return [vocabularyList, errorLineList];
  }
}
