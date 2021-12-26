export function isPrintableASCII(input: string) {
  return /^[\x20-\x7E]*$/.test(input);
}

// 「ん」のローマ字入力として「n」を使ってもいいかの判定
export function allowSingleN(ncs: string, isLastChunk: boolean): boolean {
  // 文末・単語末の場合には許容しない
  if (isLastChunk || ncs == ' ') {
    return false;
    // 次のチャンクが母音・な行・や行（「ゃ」「ゅ」「ょ」を除く）のときは許容しない
  } else if (
    ncs == 'あ'   || ncs == 'い'   || ncs == 'う'   || ncs   == 'え'  || ncs == 'お'   ||
    ncs == 'な'   || ncs == 'に'   || ncs == 'ぬ'   || ncs   == 'ね'  || ncs == 'の'   ||
    ncs == 'にゃ' || ncs == 'にぃ' || ncs == 'にゅ' || ncs   == 'にぇ'|| ncs == 'にょ' ||
    ncs == 'や'   || ncs == 'ゆ'   || ncs == 'よ'   || ncs   == 'ん') {
    return false;

    // 次のチャンクがASCIIのときは許容しない
  } else if (isPrintableASCII(ncs)) {
    return false;
  } else {
    return true;
  }
}
