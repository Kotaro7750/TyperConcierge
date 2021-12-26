export function isPrintableASCII(input: string) {
  return /^[\x20-\x7E]*$/.test(input);
}

// 「ん」のローマ字入力として「n」を使ってもいいかの判定
export function allowSingleN(ncs: string, isLastChunk: boolean): boolean {
  // 文末の場合には許容しない
  if (isLastChunk) {
    return false;
    // 次のチャンクが母音・な行・や行（「ゃ」「ゅ」「ょ」を除く）・スペース（単語末）のときは許容しない
    // TODO 次のチャンクがASCIIのときもだめ
    // TODO 次のチャンクが「ん」のときもだめ
  } else if (
    ncs == 'あ'   || ncs == 'い'   || ncs == 'う'   || ncs   == 'え'  || ncs == 'お'   ||
    ncs == 'な'   || ncs == 'に'   || ncs == 'ぬ'   || ncs   == 'ね'  || ncs == 'の'   ||
    ncs == 'にゃ' || ncs == 'にぃ' || ncs == 'にゅ' || ncs   == 'にぇ'|| ncs == 'にょ' ||
    ncs == 'や'   || ncs == 'ゆ'   || ncs == 'よ'   || ncs   == ' ') {
    return false;
  } else {
    return true;
  }
}
