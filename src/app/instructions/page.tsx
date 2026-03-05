"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Globe, 
  Gamepad2, 
  CreditCard, 
  Settings,
  Link as LinkIcon,
  DollarSign
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useState } from "react";
import { ROBLOX_GAMEPASS_PRICE_MAP } from "@/lib/roblox-pricing";
import Link from "next/link";

export default function InstructionsPage() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const priceRows = Object.entries(ROBLOX_GAMEPASS_PRICE_MAP)
    .map(([nominal, gamepassPrice]) => ({ nominal: Number(nominal), gamepassPrice }))
    .sort((a, b) => a.nominal - b.nominal);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      number: 1,
      title: "Откройте Roblox Studio или сайт Roblox",
      description: "Перейдите на https://www.roblox.com/ и войдите в свой аккаунт",
      icon: Globe,
      color: "bg-blue-100 text-blue-600",
      link: "https://www.roblox.com/",
      linkText: "Открыть Roblox"
    },
    {
      number: 2,
      title: "Перейдите в раздел «Создание» (Create)",
      description: "В меню сверху выберите вкладку Create или перейдите по ссылке",
      icon: Settings,
      color: "bg-green-100 text-green-600",
      link: "https://create.roblox.com/",
      linkText: "Открыть Create"
    },
    {
      number: 3,
      title: "Выберите свою игру (Experience)",
      description: "Найдите игру, в которой хотите создать GamePass, и нажмите Manage Experience",
      icon: Gamepad2,
      color: "bg-purple-100 text-purple-600"
    },
    {
      number: 4,
      title: "Создайте GamePass",
      description: "В меню слева выберите Passes → Create a Pass. Введите название и описание (любые — например, \"Донат\")",
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600"
    },
    {
      number: 5,
      title: "Укажите цену",
      description: "После создания откройте GamePass, нажмите Configure → Sales, включите «Item for Sale» и укажите цену в Robux (например, 100)",
      icon: DollarSign,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      number: 6,
      title: "❗ Обязательно отключите региональную цену",
      description: "В Configure → Sales ОБЯЗАТЕЛЬНО выключите Regional Pricing (Региональная цена), чтобы цена была одинаковой для всех регионов.",
      icon: Settings,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      number: 7,
      title: "Скопируйте ссылку на GamePass",
      description: "После сохранения откройте страницу GamePass и скопируйте ссылку из адресной строки. Pass ID — это цифры после /game-pass/ и до следующего /. Пример: /game-pass/123456789/Donation -> Pass ID: 123456789.",
      icon: LinkIcon,
      color: "bg-red-100 text-red-600",
      example: "https://www.roblox.com/game-pass/123456789/Donation"
    },
    {
      number: 8,
      title: "Вставьте ссылку и код на сайте RBXPass",
      description: "Перейдите на наш сайт, вставьте ссылку на GamePass и код, полученный после покупки",
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      number: 9,
      title: "Дождитесь зачисления Robux",
      description: "После активации кодов Robux поступят на ваш аккаунт в течение 5–7 дней",
      icon: CheckCircle,
      color: "bg-teal-100 text-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation currentPage="instructions" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto glass-panel rounded-2xl px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🧩 Инструкция по созданию GamePass
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Пошаговое руководство по созданию GamePass для получения Robux
            </p>
            <p className="text-sm text-gray-500">
              Следуйте инструкции ниже, чтобы создать GamePass и активировать ваш код
            </p>
            <div className="mt-4 flex justify-center">
              <Button asChild className="h-12 px-6 text-base font-semibold bg-red-600 hover:bg-red-700 shadow-lg">
                <a
                  href="https://rutube.ru/video/a2652268ba8a379f99c77eecb5ac7745/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Смотреть видеоинструкцию
                </a>
              </Button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              const isRegionalPricingStep = step.number === 6;
              return (
                <Card key={step.number} className={`shadow-lg ${isRegionalPricingStep ? "border-red-300 bg-red-50/40" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isRegionalPricingStep ? "bg-red-100 text-red-600" : step.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={`text-lg font-bold ${isRegionalPricingStep ? "border-red-300 text-red-700" : ""}`}>
                            Шаг {step.number}
                          </Badge>
                          <CardTitle className={`text-xl ${isRegionalPricingStep ? "text-red-700" : ""}`}>{step.title}</CardTitle>
                        </div>
                        <CardDescription className={`text-base ${isRegionalPricingStep ? "text-red-700" : ""}`}>
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {step.example && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-gray-700 break-all">
                            {step.example}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(step.example!, step.number)}
                            className="ml-2"
                          >
                            {copiedStep === step.number ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {step.link && (
                      <Button asChild className="w-full sm:w-auto">
                        <a 
                          href={step.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {step.linkText}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Call to Action */}
          <Card className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Готовы активировать ваш код?
              </h2>
              <p className="text-blue-100 mb-6">
                Следуйте инструкции выше, создайте GamePass и активируйте ваш код
              </p>
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
                <Link href="/">Начать активацию</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Price Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Таблица цен GamePass
              </CardTitle>
              <CardDescription>
                Укажите соответствующую цену для вашего номинала кода
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Купленный номинал</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Цена GamePass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRows.map((row) => (
                      <tr key={row.nominal} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">Roblox {row.nominal}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.gamepassPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Важная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  <strong>Время зачисления:</strong> Robux поступят на ваш аккаунт в течение 5–7 дней после активации кода
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  <strong>Безопасность:</strong> Все операции защищены и проверены. Ваши данные в безопасности
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">
                  <strong>Поддержка:</strong> Если у вас возникли вопросы, обратитесь в службу поддержки
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
