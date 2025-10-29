"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  CreditCard, 
  Loader2,
  Copy,
  Gamepad2,
  Sparkles
} from "lucide-react";
import { Navigation } from "@/components/navigation";

export default function CodeActivationPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [gamepassUrl, setGamepassUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activationResult, setActivationResult] = useState<any>(null);

  // Валидация только для нового формата
  const validateCode = (code: string) => {
    const NEW_CODE_REGEX = /^[A-Z0-9]{2,6}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{1}$/i;
    return NEW_CODE_REGEX.test(code);
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setError("Введите код активации");
      return;
    }
    
    if (!validateCode(code)) {
      setError("Неверный формат кода. Используйте формат: PREFIX-XXXX-XXXX-Y");
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Проверяем код перед переходом к следующему шагу
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (!data.ok) {
        setError(data.error || "Ошибка проверки кода");
        return;
      }
      
      // Код валиден, переходим к подтверждению
      setActivationResult(data);
      setStep(2);
      
    } catch (err) {
      setLoading(false);
      setError("Ошибка соединения с сервером");
    }
  };

  const handleActivation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/activate-gamepass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: code.toUpperCase(), 
          gamepassUrl: gamepassUrl.trim(),
          nickname: nickname.trim(),
        }),
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (!data.ok) {
        setError(data.error || "Ошибка активации");
        return;
      }
      
      setActivationResult(data);
      setSuccess(data.message || "Код успешно активирован!");
      
    } catch (err) {
      setLoading(false);
      setError("Ошибка соединения с сервером");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Можно добавить toast-уведомление о успешном копировании
  };

  const resetForm = () => {
    setCode("");
    setNickname("");
    setGamepassUrl("");
    setStep(1);
    setError(null);
    setSuccess(null);
    setActivationResult(null);
  };

  const progressValue = (step / 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <Navigation currentPage="activation" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Активация кода
              </h1>
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xl text-gray-600 mb-2">
              Активируйте ваш код для получения Robux
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Шаг {step} из 2</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step 1: Code Input */}
          {step === 1 && (
            <Card className="shadow-xl border-2 border-purple-100">

              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-lg font-semibold">
                    Код активации
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="RBX-ABCD-EFGH-5"
                    className="font-mono text-lg text-center h-14 border-2"
                    disabled={loading}
                  />
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      📝 Формат: <strong>PREFIX-XXXX-XXXX-Y</strong>
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                      <span className="font-mono">RBX-1A2B-3C4D-5</span>
                      <span className="font-mono">ANTI-C0DE-F1G2-8</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCodeSubmit} 
                  disabled={!code.trim() || loading}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Проверка кода...
                    </>
                  ) : (
                    "Проверить код"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && activationResult && (
            <Card className="shadow-xl border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Подтверждение активации
                </CardTitle>
                <CardDescription>
                  Код проверен и готов к активации
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Информация о коде */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 space-y-4 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Код:</span>
                    <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
                      {code}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Номинал:</span>
                    <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500">
                      {activationResult.nominal} Robux
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Статус:</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Готов к активации
                    </Badge>
                  </div>
                </div>

                {/* Данные для GamePass */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Ваш ник в Roblox</Label>
                    <Input 
                      id="nickname" 
                      placeholder="Например, SuperPlayer123"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gamepass">Ссылка на ваш GamePass</Label>
                    <Input 
                      id="gamepass" 
                      placeholder="https://www.roblox.com/game-pass/1234567/Name"
                      value={gamepassUrl}
                      onChange={(e) => setGamepassUrl(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Separator />
                
                {/* Кнопки действий */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleActivation} 
                    disabled={loading || !nickname.trim() || !gamepassUrl.trim()}
                    className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Активация...
                      </>
                    ) : (
                      "🎯 Активировать код"
                    )}
                  </Button>

                  <Button 
                    onClick={() => setStep(1)} 
                    variant="outline"
                    className="w-full h-11"
                    disabled={loading}
                  >
                    Назад к вводу кода
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {success && activationResult && (
            <Card className="mt-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-6 h-6" />
                  Активация успешна!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  <p className="text-green-800 font-semibold text-lg text-center">
                    {success}
                  </p>
                  
                  <div className="bg-white rounded-xl p-5 border-2 border-green-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Код:</span>
                        <p className="font-mono font-bold text-base">{code}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Номинал:</span>
                        <p className="font-bold text-green-600 text-base">{activationResult.nominal} Robux</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Статус:</span>
                        <Badge className="bg-green-500 text-white">
                          Активирован
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Время:</span>
                        <p className="text-xs font-mono">{new Date().toLocaleString('ru-RU')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={resetForm}
                      className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      🔄 Активировать другой код
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard(code)}
                      variant="outline" 
                      className="flex-1 h-11"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription className="flex items-center justify-between">
                <span className="font-semibold">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetForm}
                  className="ml-2 border-white text-white hover:bg-red-700"
                >
                  Попробовать снова
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Help Section */}
        </div>
      </div>
    </div>
  );
}
