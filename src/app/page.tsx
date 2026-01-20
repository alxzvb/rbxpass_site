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
  Loader2,
  Copy,
  AlertTriangle,
  KeyRound,
  Gamepad2,
  Flame,
  Crosshair,
  Shapes,
} from "lucide-react";
import { Navigation } from "@/components/navigation";

type ProductType = "roblox" | "fortnite" | "pubg" | "other";

export default function CodeActivationPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [productType, setProductType] = useState<ProductType>("roblox");
  const [nickname, setNickname] = useState("");
  const [gamepassUrl, setGamepassUrl] = useState("");
  const [telegram, setTelegram] = useState("");
  const [epicLogin, setEpicLogin] = useState("");
  const [epicPassword, setEpicPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activationResult, setActivationResult] = useState<any>(null);

  // Валидация только для нового формата
  const validateCode = (code: string) => {
    const NEW_CODE_REGEX = /^[A-Z0-9]{2,6}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{1}$/i;
    const OLD_CODE_REGEX = /^RBX100-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    return NEW_CODE_REGEX.test(code) || OLD_CODE_REGEX.test(code);
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
      
      // Автоопределение типа продукта по префиксу кода
      const codePrefix = code.toUpperCase().split("-")[0];
      if (codePrefix.startsWith("RBX") || codePrefix === "RBX100") {
        setProductType("roblox");
      } else if (codePrefix.startsWith("FNT") || codePrefix.startsWith("FORTNITE")) {
        setProductType("fortnite");
      } else if (codePrefix.startsWith("PUBG") || codePrefix.startsWith("PUB")) {
        setProductType("pubg");
      } else if (data.productType) {
        setProductType(data.productType as ProductType);
      }
      
      // Код валиден, переходим к подтверждению
      setActivationResult(data);
      setStep(2);
      
    } catch {
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
          productType,
          gamepassUrl: gamepassUrl.trim(),
          nickname: nickname.trim(),
          telegram: telegram.trim(),
          epicLogin: epicLogin.trim(),
          epicPassword: epicPassword.trim(),
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
      
    } catch {
      setLoading(false);
      setError("Ошибка соединения с сервером");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetForm = () => {
    setCode("");
    setNickname("");
    setGamepassUrl("");
    setTelegram("");
    setEpicLogin("");
    setEpicPassword("");
    setProductType("roblox");
    setStep(1);
    setError(null);
    setSuccess(null);
    setActivationResult(null);
  };

  const progressValue = (step / 2) * 100;

  const getProductTypeRules = () => {
    if (productType === "fortnite") {
      return (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800 space-y-2">
            <p className="font-semibold">❗ Правила для Fortnite:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Если вы покупаете через EPIC GAMES, необходимо сообщить данные от аккаунта EPIC GAMES</li>
              <li>Регион аккаунта должен быть Турция</li>
              <li>Если у вас другой регион аккаунта - Мы сменим его на Турцию</li>
              <li>❗❗❗Смена региона невозможна, если вы уже меняли его в течение последних 6 месяцев❗❗❗</li>
              <li>❗❗❗Epic Games разрешает менять регион раз в 6 месяцев❗❗❗</li>
              <li>❗❗❗На новых аккаунтах с пополнением или покупками смена региона недоступна❗❗❗</li>
              <li>Если Вы играете на Nintendo, в баксы будут на ПК, через ПК совершаете покупку и покупка уже будет на самой Nintendo (При этом нинтендо нужно связать с Эпик Гейм)</li>
              <li>Возраст любого аккаунта должен быть 18+</li>
              <li>На аккаунте не должно быть родительского контроля и никаких ограничений, которые мешают совершить покупку, либо же зайти в игру</li>
            </ul>
          </AlertDescription>
        </Alert>
      );
    }
    if (productType === "pubg") {
      return (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <p className="font-semibold">❗ Для PUBG укажите ваш Telegram для связи</p>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation currentPage="activation" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto glass-panel rounded-2xl px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <KeyRound className="w-8 h-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Активация кода
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-2">
              Активируйте ваш код для получения купленного товара/услуги
            </p>
            <p className="text-sm text-gray-600">
              Roblox • Fortnite • PUBG • и другие игры
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
                {/* Выбор типа продукта (виден сразу) */}
                <div className="space-y-2">
                  <Label>Тип продукта</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button
                      type="button"
                      variant={productType === "roblox" ? "default" : "outline"}
                      onClick={() => setProductType("roblox")}
                      className="w-full gap-2"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      Roblox
                    </Button>
                    <Button
                      type="button"
                      variant={productType === "fortnite" ? "default" : "outline"}
                      onClick={() => setProductType("fortnite")}
                      className="w-full gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      Fortnite
                    </Button>
                    <Button
                      type="button"
                      variant={productType === "pubg" ? "default" : "outline"}
                      onClick={() => setProductType("pubg")}
                      className="w-full gap-2"
                    >
                      <Crosshair className="w-4 h-4" />
                      PUBG
                    </Button>
                    <Button
                      type="button"
                      variant={productType === "other" ? "default" : "outline"}
                      onClick={() => setProductType("other")}
                      className="w-full gap-2"
                    >
                      <Shapes className="w-4 h-4" />
                      Другое
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-lg font-semibold inline-flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
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
                      {activationResult.nominal}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Тип продукта:</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      {productType === "roblox" ? "Roblox" : productType === "fortnite" ? "Fortnite" : productType === "pubg" ? "PUBG" : "Другое"}
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

                {/* Тип продукта (сводка) */}
                <div className="space-y-2">
                  <Label>Тип продукта</Label>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    {productType === "roblox" ? "Roblox" : productType === "fortnite" ? "Fortnite" : productType === "pubg" ? "PUBG" : "Другое"}
                  </Badge>
                </div>

                {/* Правила для Fortnite */}
                {getProductTypeRules()}

                {/* Данные для активации */}
                <div className="space-y-4">
                  {productType === "roblox" && (
                    <>
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
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram для связи</Label>
                        <Input 
                          id="telegram" 
                          placeholder="@username или номер телефона"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}

                  {productType === "fortnite" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="epic-login">Логин Epic Games</Label>
                        <Input 
                          id="epic-login" 
                          placeholder="Email или логин"
                          value={epicLogin}
                          onChange={(e) => setEpicLogin(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="epic-password">Пароль Epic Games</Label>
                        <Input 
                          id="epic-password" 
                          type="password"
                          placeholder="Пароль от аккаунта"
                          value={epicPassword}
                          onChange={(e) => setEpicPassword(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram для связи</Label>
                        <Input 
                          id="telegram" 
                          placeholder="@username или номер телефона"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}

                  {(productType === "pubg" || productType === "other") && (
                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram для связи</Label>
                      <Input 
                        id="telegram" 
                        placeholder="@username или номер телефона"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                <Separator />
                
                {/* Кнопки действий */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleActivation} 
                    disabled={
                      loading || 
                      (productType === "roblox" && (!nickname.trim() || !gamepassUrl.trim() || !telegram.trim())) ||
                      (productType === "fortnite" && (!epicLogin.trim() || !epicPassword.trim() || !telegram.trim())) ||
                      ((productType === "pubg" || productType === "other") && !telegram.trim())
                    }
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
                        <p className="font-bold text-green-600 text-base">{activationResult.nominal}</p>
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
        </div>
      </div>
    </div>
  );
}
