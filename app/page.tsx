'use client';

import { Button,Box, Stack, Typography, Container,TextField, Select, MenuItem, Grid, Card, SelectChangeEvent, CircularProgress } from "@mui/material";
import { useState } from "react";
import analyzeComment from "@/utils/analyzeComment";
import createHint from "@/utils/createHint";
import { getProblemByTitle ,getTitles} from "@/app/problems";
import { useRouter } from "next/navigation";
import { renderRadarChart } from "./Chart";
import { saveToLocalStorage } from "@/utils/useLocalStrage";
import CodeMirrorEditor from './CodeMirror';

export interface scores{
    knowledge:number;//基礎知識
    appropriateness:number;//適切性
    clarity:number;//明確性
    consistency:number;//一貫性
    usefulness:number;//有用性
}

export interface feedbacks{
    codeFeedback:string;//コードの読解に関するフィードバック
    commentFeedback:string;//コメントの適切さに関するフィードバック
}

export default function Home() {
  const [code, setCode] = useState("");
  const [score, setScore] = useState<scores>();
  const [feedback, setFeedback] = useState<feedbacks>({codeFeedback:"",commentFeedback:""});
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [state, setState] = useState<number>(100);
  const [hint, sethint] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const Answering = 100;
  const OpenHint = 101;
  const FeedBack = 102;
  const LoadingHint = 103;
  const LoadingFeedBack = 104

  const questionNameList:string[] = getTitles();

  // useEffect(() => {
  //   setCode(questions[0]);
  // }
  // , []);
  
  const handleClick = async (): Promise<void> => {
    const nowState:number = state;
    try{
    setState(LoadingFeedBack);
    analyzeComment(code).then(analyzedResult=>{
          if(!saveToLocalStorage(analyzedResult,title,code)){
            alert("保存に失敗しました")
          }
          setScore(analyzedResult.scores);
          setFeedback(analyzedResult.feedbacks);
          setState(FeedBack);
    });
    }catch(e){
      console.log(`採点中にエラーだよ${e}`);
      setState(nowState);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedTitle = event.target.value as string;
  
    // 現在の状態が「回答中」ではない場合
    if (state !== Answering) {
      const confirmChange = window.confirm("問題を変えますか？");
      if (!confirmChange) {
        return; // ユーザーが「いいえ」を選んだ場合は処理を中断
      }
    }
    setState(Answering);
    setSelectedProblem(selectedTitle);
    setTitle(selectedTitle);
    setCode(getProblemByTitle(selectedTitle)); // 選ばれた問題に基づいてコードを更新
  };
  

  const fetchHint = async (): Promise<void> => {
      setState(LoadingHint);
      try {
        createHint(code)
          .then(h=>{
            sethint(h as string)
            setState(OpenHint);
          })
      } catch (e) {
        console.log(`ヒント作成中にエラーだよ${e}`);
        setState(Answering);
      }
  }
  const router = useRouter();
  
  return (
    <Box sx={{ width: '100%', mt: 10, margin: 2 }}>
      <Container>
        <Stack spacing={5}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="text" 
              component="h1" 
              sx={{ textAlign: 'left' }}
              onClick={() => router.push('/')}
            >
              code-comment-add
            </Button>
            <Button
              variant="text"
              component="h1"
              sx={{ textAlign: 'right' }}
              onClick={() => router.push('/history')} // 履歴ページに遷移
            >
              履歴
            </Button>
          </Box>
  
          {/* 問題選択 */}
          <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
            <Typography variant="h4">問題選択</Typography>
            <Select
              value={selectedProblem}
              onChange={handleSelectChange}
              displayEmpty
              sx={{ width: 300 }}
            >
              <MenuItem value="" disabled>問題を選択</MenuItem>
              {questionNameList.map((questionName,i)=>(<MenuItem value={questionName} key={i}>{questionName}</MenuItem>))}
            </Select>
          </Box>
  
          {state === OpenHint && (
            <Box sx={{ border: "1px solid #000", padding: 2, maxWidth: "100%", borderRadius: 2, boxShadow: 1, backgroundColor: "#fffff9", position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 0, left: -10, backgroundColor: 'transparent', borderRadius: '50%', padding: '10px 10px', border: 'none', fontSize: '28px' }}>
                💡
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ paddingLeft: 4 }}>
                {hint.split(' ').map((word, index) => (
                  <span key={index}>
                    {word.includes('`') ? <code>{word.replace(/`/g, '')}</code> : word}{' '}
                  </span>
                ))}
              </Typography>
            </Box>
          )}
  
          {/* コード入力 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h3">コメントの入力</Typography>
            <Button variant="contained" onClick={() => fetchHint()}>
              {state === LoadingHint ? <CircularProgress size={24} color="inherit" /> : "ヒント"}
            </Button>
          </Box>
  
          {/* <TextField
            multiline
            rows={code.split('\n').length || 1}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ width: "100%", alignSelf: "center", backgroundColor: "#f5f5f5" }}
            disabled={state === FeedBack}
          /> */}
          <CodeMirrorEditor
        code={code}
        setCode={setCode}
        state={state}
        FeedBack={FeedBack}
      />
  
          {/* 採点ボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="contained" sx={{ width: 'fit-content', marginRight: "10px" }} onClick={handleClick}>
              {state === LoadingFeedBack ? <CircularProgress size={24} color="inherit" /> : "採点"}
            </Button>
          </Box>
  
          {/* stateがFeedBackの場合のみ見えるブロック */}
          {state === FeedBack && (
            <Box sx={{ display: "flex" }}>
              <Grid container spacing={4} justifyContent="space-between" alignItems="flex-start">
                {/* レーダーチャート */}
                <Grid item xs={12} md={6}>
                  <Box>
                    {renderRadarChart(score)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      フィードバック
                    </Typography>
                    <Card sx={{ padding: 2, marginBottom: 2 }}>
                      <Typography variant="h6">コードの読解に関するフィードバック</Typography>
                      <Typography>{feedback.codeFeedback}</Typography>
                    </Card>
                    <Card sx={{ padding: 2 }}>
                      <Typography variant="h6">コメントの適切さに関するフィードバック</Typography>
                      <Typography>{feedback.commentFeedback}</Typography>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
  
          {/* 評価基準の表示 */}
          
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>評価基準</Typography>
              <Typography variant="body1" gutterBottom>
                <strong>基礎知識:</strong> プログラミング言語の文法、構文、基本的な概念に関するコメントが含まれているかを評価します。変数や関数の説明など。
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>適切性:</strong> コメントがコードの目的や動作に適切に関連しているかを評価します。コードの目的や動作の説明、コードの制約や制限事項の説明など。
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>明確性:</strong> コメントの表現が明確で理解しやすいかを評価します。簡潔で分かりやすい言葉遣い、専門用語の適切な使用、文法的に正しい文章など。
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>一貫性:</strong> コメントのスタイルや形式が一貫しているかを評価します。コメントの書き方に揺らぎがないか、同じ種類の情報を同じ形式で記述しているかなど。
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>有用性:</strong> コメントが実際に役立つ情報を提供しているかを評価します。将来のメンテナンスに役立つ情報、バグ修正や機能追加の際に参考になる情報など。
              </Typography>
            </Box>
        </Stack>
      </Container>
    </Box>
  );  
}
