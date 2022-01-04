import React from 'react';

export function SelectDictionaryPane(props: { availableDictionaryNameList: string[], usedDictionaryDispatcher: React.Dispatch<{ type: string, name: string }> }): JSX.Element {

  const elem: JSX.Element[] = [];

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      props.usedDictionaryDispatcher({ type: 'add', name: e.target.value });
    } else {
      props.usedDictionaryDispatcher({ type: 'delete', name: e.target.value });
    }
  }

  props.availableDictionaryNameList.forEach((dictionaryName: string, i: number) => {
    const checkbox = (
      <div key={i} className='form-check'>
        <label className='form-check-label'>
          <input className='form-check-input' type='checkbox' value={dictionaryName} onChange={onChange} />
          {dictionaryName}
        </label>
      </div>
    );

    elem.push(checkbox);
  });

  return (
    <div className='row'>
      <div className='col-12'>
        {elem}
      </div>
    </div>
  );
}
