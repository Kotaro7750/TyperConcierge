import React, { useState, useMemo, createContext } from 'react';
import { TypingView } from './TypingView';
import { ResultView } from './ResultView';
import { ModeSelectView } from './ModeSelectView';

import { constructQueryInformation } from './utility';

import { useVocabulary } from './useVocabulary';

// FIXME 関数の初期値を渡す場合にはどうしたらいいのだろうか
export const VocabularyContext = createContext<{ availableDictionaryList: DictionaryInfo[], setUsedDictionaryList: React.Dispatch<React.SetStateAction<string[]>> | undefined, loadAvailableDictionaryList: () => void }>(
  {
    availableDictionaryList: [],
    setUsedDictionaryList: undefined,
    loadAvailableDictionaryList: () => { },
  }
);

export const GameStateContext = createContext<GameStateContext>({} as GameStateContext);
export const TypingResultContext = createContext<TypingResultContext>({} as TypingResultContext);

export function App() {
  const [gameState, setGameState] = useState<GameState>('ModeSelect');
  const [typingResult, setTypingResult] = useState<TypingResult>({} as TypingResult);

  // TODO ここらへんuseReduceが使えそう
  const [availableDictionaryList, setUsedDictionaryList, loadAvailableDictionaryList, vocabularyEntryList] = useVocabulary();

  const queryInformation: QueryInformation = useMemo(() => constructQueryInformation(vocabularyEntryList, 100), [vocabularyEntryList]);

  return (
    <div className='container-fluid'>
      <GameStateContext.Provider value={{ gameState: gameState, setGameState: setGameState }}>
        {
          gameState === 'ModeSelect'
            ? <VocabularyContext.Provider value={{ availableDictionaryList: availableDictionaryList, setUsedDictionaryList: setUsedDictionaryList, loadAvailableDictionaryList: loadAvailableDictionaryList }}>
              <ModeSelectView />
            </VocabularyContext.Provider>

            : gameState === 'Started' ? <TypingResultContext.Provider value={{ typingResult: typingResult, setTypingResult: setTypingResult }}><TypingView queryInformation={queryInformation} /></TypingResultContext.Provider>

              : <ResultView result={typingResult} />
        }
      </GameStateContext.Provider>
    </div>
  );
}
