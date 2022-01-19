import _, { useState, createContext } from 'react';
import { TypingView } from './TypingView';
import { ResultView } from './ResultView';
import { ModeSelectView } from './ModeSelectView';

import { useVocabulary } from './useVocabulary';

// FIXME 関数の初期値を渡す場合にはどうしたらいいのだろうか
export const VocabularyContext = createContext<{ library: Library, libraryOperator: (action: LibraryOperatorActionType) => void }>(
  {
    library: {
      availableDictionaryList: { word: [], sentence: [] },
      usedDictionaryFileNameList: { word: [], sentence: [] },
      usedVocabularyType: 'word',
      vocabularyEntryList: [],
    },
    libraryOperator: () => { },
  }
);

export const GameStateContext = createContext<GameStateContext>({} as GameStateContext);
export const TypingResultContext = createContext<TypingResultContext>({} as TypingResultContext);

export function App() {
  const [gameState, setGameState] = useState<GameState>('ModeSelect');
  const [typingResult, setTypingResult] = useState<TypingResult>({} as TypingResult);

  const [library, libraryOperator] = useVocabulary();

  return (
    <div className='container-fluid'>
      <GameStateContext.Provider value={{ gameState: gameState, setGameState: setGameState }}>
        {
          gameState === 'ModeSelect'
            ? <VocabularyContext.Provider value={{ library: library, libraryOperator: libraryOperator }}>
              <ModeSelectView />
            </VocabularyContext.Provider>

            : gameState === 'Started' ? <TypingResultContext.Provider value={{ typingResult: typingResult, setTypingResult: setTypingResult }}><TypingView library={library} /></TypingResultContext.Provider>

              : <ResultView result={typingResult} />
        }
      </GameStateContext.Provider>
    </div>
  );
}
