import { useRouter } from "next/router";
import { useState } from "react";
import VoiceIntake from "../components/VoiceIntake";
import { generateAuraCode } from "../lib/generateAuraCode";

export default function GetYourAura(){
  const router = useRouter();
  const path = (router.query.path || "Universal")+"";
  const [result, setResult] = useState(null);

  async function onDone({ transcript, reading }){
    const { code, color } = generateAuraCode("Friend", "1970-01-01");
    setResult({ transcript, reading, code, color });
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold">Speak to a Mentor</h2>
      <p className="text-gray-600">
        Share what matters to you — worries, hopes, a story. AuraCode will reflect gently in the tone of {path}.
      </p>
      <VoiceIntake path={path} onDone={onDone} />
      {result && (
        <div className="p-6 rounded-2xl border bg-white/70">
          <p className="text-xs text-gray-500">Your AuraCode: <span className="font-mono">{result.code} · {result.color}</span></p>
          <div className="mt-3 whitespace-pre-wrap">{result.reading}</div>
          <p className="mt-4 text-xs text-gray-500">We hold space; we don’t promise outcomes.</p>
        </div>
      )}
    </div>
  );
}
