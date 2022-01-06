import React from 'react';

export function SelectDictionaryPane(props: { availableDictionaryNameList: string[], usedDictionaryList: string[], usedDictionaryDispatcher: React.Dispatch<{ type: string, name: string }> }): JSX.Element {

  const usedDictionaryOneHot = new Map<string, boolean>(props.usedDictionaryList.map(e => [e, true]));

  const elem: JSX.Element[] = [];

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      props.usedDictionaryDispatcher({ type: 'add', name: e.target.value });
    } else {
      props.usedDictionaryDispatcher({ type: 'delete', name: e.target.value });
    }
  }

  props.availableDictionaryNameList.forEach((dictionaryName: string, i: number) => {
    //const checkbox = (
    //  <div key={i} className='form-check'>
    //    <label className='form-check-label'>
    //      <input className='form-check-input' type='checkbox' value={dictionaryName} onChange={onChange} checked={usedDictionaryOneHot.has(dictionaryName)} />
    //      {dictionaryName}
    //    </label>
    //  </div>
    //);

    const checkbox = (
      <label key={i} className={`list-group-item w-100 btn ${usedDictionaryOneHot.has(dictionaryName) && 'active'}`}>
        <input className='btn-check' type='checkbox' value={dictionaryName} onChange={onChange} checked={usedDictionaryOneHot.has(dictionaryName)} />
        {dictionaryName}
      </label>
    );

    elem.push(checkbox);
  });

  return (
    <div className='h-100 w-100 list-group overflow-auto'>
      {elem}
    </div>
  );
}
