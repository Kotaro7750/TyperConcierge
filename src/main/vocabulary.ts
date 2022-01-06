import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

import { fatalErrorAndExit } from './utility';
import { isValidVocabulary } from '../commonUtility';

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
        errorLineList: dictionary.errorLineList,
        enable: dictionary.enable,
      };

      dictionaryInfoList.push(dictionaryInfo);
    }

    return dictionaryInfoList;
  }

  getVocabularyEntryList = (usedDictionaryNameList: string[]): Array<VocabularyEntry> => {
    let vocabularyEntryList: Array<VocabularyEntry> = [];

    usedDictionaryNameList.forEach(dictionaryName => {
      if (this.dictionaryMap.has(dictionaryName)) {
        // キーを持っていることは確かめているのでキャストしてもよいはず
        vocabularyEntryList = vocabularyEntryList.concat((this.dictionaryMap.get(dictionaryName) as Dictionary).content);
      }
    });

    return vocabularyEntryList;
  }

  initVocabulary = async (): Promise<void> => {
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

    const dictionaryPromiseList: Promise<Dictionary>[] = [];

    dictionaryFileList.forEach(dictionaryFile => {
      const extension = path.extname(dictionaryFile);

      if (extension === '.tconciergew' || extension === '.tconcierges') {
        const filePath = path.join(vocabularyDirPath, dictionaryFile);

        dictionaryPromiseList.push(this.initDictionary(filePath));
      }
    });

    await Promise.allSettled(dictionaryPromiseList).then(result => {
      result.forEach(result => {
        if (result.status === 'fulfilled') {
          const dictionary = result.value;

          this.dictionaryMap.set(dictionary.name, dictionary);
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

      if (extension === '.tconciergew') {
        [dictionaryContent, errorLineList] = this.parseWordDictionary(content);
      } else {
        [dictionaryContent, errorLineList] = this.parseSentenceDictionary(content);
      }

      return {
        name: dictionaryName,
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
