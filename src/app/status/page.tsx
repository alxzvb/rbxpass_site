"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Navigation } from "@/components/navigation";

const statusConfig = {
  queued: {
    label: "В очереди",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Ваш заказ добавлен в очередь на обработку"
  },
  processing: {
    label: "В обработке",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
    description: "Заказ обрабатывается, пожалуйста, подождите"
  },
  done: {
    label: "Выполнен",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Заказ успешно выполнен! Товар или услуга доставлены"
  },
  error: {
    label: "Ошибка",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Произошла ошибка при обработке заказа"
  }
};

export default function StatusPage() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [foundShortCode, setFoundShortCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supportTelegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || "@your_support_tg";

  async function checkByCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    setFoundShortCode(null);

    try {
      const res = await fetch(`/api/status?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.ok) return setError(data.error ?? "Заказ не найден");
      setStatus(data.order.status);
      setFoundShortCode(data.order.short_code);
    } catch {
      setError("Не удалось проверить статус");
    } finally {
      setLoading(false);
    }
  }

  async function checkByNickname() {
    if (!nickname.trim()) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    setFoundShortCode(null);

    try {
      const res = await fetch(`/api/status?nickname=${encodeURIComponent(nickname.trim())}`);
      const data = await res.json();
      if (!data.ok) return setError(data.error ?? "Заказ не найден");
      setStatus(data.order.status);
      setFoundShortCode(data.order.short_code);
    } catch {
      setError("Не удалось проверить статус");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = status ? statusConfig[status as keyof typeof statusConfig] : null;
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation currentPage="status" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto glass-panel rounded-2xl px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              📊 Статус заказа
            </h1>
            <p className="text-xl text-gray-600">
              Проверка статуса по любым кодам (Roblox, Fortnite, PUBG и др.)
            </p>
          </div>

          {/* Main Card */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Проверка статуса</CardTitle>
              <CardDescription className="text-center">
                Введите короткий код из подтверждения активации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status-code">Код заказа</Label>
                <div className="flex gap-2">
                  <Input
                    id="status-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="font-mono"
                  />
                  <Button 
                    onClick={checkByCode} 
                    disabled={loading || !code.trim()}
                    className="px-6"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Проверить
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-nickname">Roblox ник</Label>
                <div className="flex gap-2">
                  <Input
                    id="status-nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="username"
                  />
                  <Button
                    onClick={checkByNickname}
                    disabled={loading || !nickname.trim()}
                    variant="outline"
                    className="px-6"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "По нику"
                    )}
                  </Button>
                </div>
              </div>

              {/* Status Display */}
              {status && statusInfo && (
                <Alert>
                  <StatusIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Текущий статус:</span>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {foundShortCode && (
                        <p className="text-sm text-gray-700">
                          Код заказа: <span className="font-mono font-medium">{foundShortCode}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {statusInfo.description}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">💡 Где найти код заказа?</h3>
                <p className="text-sm text-blue-800">
                  Короткий код заказа (например, ABC123) вы получили после успешной активации. 
                  Он отображается в сообщении подтверждения.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  Есть вопросы? Напишите в Telegram поддержку: <span className="font-medium">{supportTelegram}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Legend */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">В очереди</h3>
                    <p className="text-sm text-gray-600">Заказ ожидает обработки</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">В обработке</h3>
                    <p className="text-sm text-gray-600">Заказ выполняется</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Выполнен</h3>
                    <p className="text-sm text-gray-600">Заказ завершен</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Ошибка</h3>
                    <p className="text-sm text-gray-600">Требуется помощь</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


