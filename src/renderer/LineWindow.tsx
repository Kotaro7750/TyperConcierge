import _ from 'react';

// 行リストの中からcurrentLineIndexの周辺のwindowCapacity行だけ表示する
// windowCapacityが奇数ならcurrentIndexから上下対象に表示する
// Ex. windowCapacityが5でcurrentIndexが2なら0,1,2,3,4行目を表示する
// windowCapacityが偶数ならcurrentIndexの後を多く表示する
// Ex. windowCapacityが4でcurrentIndexが2なら1,2,3,4行目を表示する
export function LineWindow(props: { lineList: JSX.Element[], currentLineIndex: number, windowCapacity: number }): JSX.Element {

  // windowCapacityよりも要素数が少ない場合には空の要素で埋める
  let filledLineList = Array.from(props.lineList);

  if (filledLineList.length < props.windowCapacity) {
    const shortageCount = props.windowCapacity - filledLineList.length;
    // 埋める要素は存在すればなんでもいい
    const shortageFiller = (new Array(shortageCount)).fill(<div></div>);

    filledLineList = filledLineList.concat(shortageFiller);
  }

  // 埋められた空の要素に対しても同じ高さを維持するために手動でCSSのflex:1を適用する
  filledLineList = filledLineList.map((elem, i) => <div key={i} style={{ flex: 1 }} className='w-100'>{elem}</div>);

  // 表示ウィンドウの両端を決定する
  let firstLineIndex = props.currentLineIndex - (props.windowCapacity % 2 == 1 ? Math.floor(props.windowCapacity / 2) : (props.windowCapacity / 2 - 1));
  let lastLineIndex = props.currentLineIndex + Math.floor(props.windowCapacity / 2);

  // 表示ウィンドウが要素リストからはみ出るときの補正
  // 空の要素で埋めているため両方向に同時にはみ出ることはない
  if (firstLineIndex < 0) {
    const offset = Math.round(-1 * firstLineIndex);
    firstLineIndex += offset;
    lastLineIndex += offset;
  } else if (lastLineIndex > (filledLineList.length - 1)) {
    const offset = Math.round(lastLineIndex - (filledLineList.length - 1));
    firstLineIndex -= offset;
    lastLineIndex -= offset;
  }

  // 表示ウィンドウ内にある行だけを抽出
  const activeLineList = filledLineList.filter((_, i) => {
    return firstLineIndex <= i && i <= lastLineIndex;
  });

  return (
    <div className='w-100 h-100 d-flex flex-column justify-content-between'>
      {activeLineList}
    </div>
  )
}

