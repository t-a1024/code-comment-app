import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';

interface CodeMirrorEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  state: number;
  FeedBack: number;
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ code, setCode, state, FeedBack }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorHeight, setEditorHeight] = useState<string>('200px');

  // 行数をもとにエディタの高さを決定
  useEffect(() => {
    const lineCount = code.split('\n').length;
    const newHeight = `${Math.max(lineCount, 5) * 24}px`; // 最低5行、高さを設定
    setEditorHeight(newHeight);
  }, [code]);

  useEffect(() => {
    if (!editorRef.current) return;

    // EditorViewの初期化
    const view = new EditorView({
      doc: code, // 初期コードを設定
      extensions: [
        basicSetup,
        javascript(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== code) {  // コードが変更された場合にのみ更新
              setCode(newValue);
            }
          }
        }),
      ],
      parent: editorRef.current,
    });

    // コンポーネントがアンマウントされるときにエディタを破棄
    return () => {
      view.destroy();
    };
  }, [code, setCode]);

  return (
    <div
      ref={editorRef}
      style={{
        width: '100%',
        backgroundColor: '#f5f5f5',
        height: editorHeight,
        borderRadius: '4px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: state === FeedBack ? 'none' : 'auto', // FeedBackの状態でエディタを無効化
      }}
    />
  );
};

export default CodeMirrorEditor;
