import React, { useState, useContext, useEffect } from 'react';

import { VocabularyContext } from './App';

export function SelectDictionaryPane(): JSX.Element {
  const vocabularyContext = useContext(VocabularyContext);

  const [dictionaryName, setDictionaryName] = useState<string>('');
  const elem: JSX.Element[] = [];

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDictionaryName(e.target.value);
    // FIXME 確定してから呼ばないと選択しただけでapi呼び出しされてしまう
    if (vocabularyContext.setUsedDictionaryList != undefined) {
      vocabularyContext.setUsedDictionaryList([e.target.value]);
    }
  }

  // FIXME 初期選択されている辞書に対してはsetUsedDictionaryListが呼ばれないのでクラッシュする
  vocabularyContext.availableDictionaryNameList.forEach((dictionaryName: string, i: number) => {
    elem.push(<option key={i} value={dictionaryName}>{dictionaryName}</option>);
  });

  return (
    <div className='row'>
      <div className='col-12'>
        <select className='form-select' value={dictionaryName} onChange={onChange}>
          {elem}
        </select>
      </div>
    </div>
  );
}
