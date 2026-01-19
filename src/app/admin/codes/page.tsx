"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  DollarSign,
  Calendar,
  AlertTriangle,
  Zap,
  Download
} from "lucide-react";

type Code = {
  id: number;
  code: string;
  nominal: number;
  status: string;
  used_at: string | null;
  product_type?: string | null;
};

export default function AdminCodes() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Форма для добавления кода
  const [newCode, setNewCode] = useState("");
  const [newNominal, setNewNominal] = useState(100);
  const [newProductType, setNewProductType] = useState("roblox");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Форма для генерации кодов
  const [generateCount, setGenerateCount] = useState(10);
  const [generateNominal, setGenerateNominal] = useState(100);
  const [generatePrefix, setGeneratePrefix] = useState("RBX100");
  const [generateProductType, setGenerateProductType] = useState("roblox");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const updateGenerateType = (value: string) => {
    setGenerateProductType(value);
    if (value === "roblox") setGeneratePrefix("RBX100");
    if (value === "fortnite") setGeneratePrefix("FNT");
    if (value === "pubg") setGeneratePrefix("PUBG");
    if (value === "other") setGeneratePrefix("CODE");
  };

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/codes");
      if (!res.ok) {
        setError("Ошибка загрузки кодов");
        return;
      }
      const data = await res.json();
      setCodes(data.codes || []);
    } catch {
      setError("Ошибка загрузки кодов");
    } finally {
      setLoading(false);
    }
  }, []);

  const addCode = async () => {
    if (!newCode.trim()) {
      setError("Введите код");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch("/api/v1/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          nominal: newNominal,
          status: "active",
          productType: newProductType
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка добавления кода");
        return;
      }
      
      setSuccess("Код успешно добавлен!");
      setNewCode("");
      setNewNominal(100);
      setShowAddForm(false);
      loadCodes();
    } catch {
      setError("Ошибка добавления кода");
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    if (generateCount < 1 || generateCount > 1000) {
      setError("Количество кодов должно быть от 1 до 1000");
      return;
    }
    
    if (generateNominal < 1) {
      setError("Номинал должен быть больше 0");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch("/api/v1/admin/codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          nominal: generateNominal,
          prefix: generatePrefix,
          productType: generateProductType
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка генерации кодов");
        return;
      }
      
      const data = await res.json();
      setGeneratedCodes(data.codes || []);
      setSuccess(data.message);
      setShowGenerateForm(false);
      loadCodes();
    } catch {
      setError("Ошибка генерации кодов");
    } finally {
      setLoading(false);
    }
  };

  const downloadCodes = () => {
    const codesText = generatedCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes_${generatePrefix}_${generateNominal}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteCode = async (id: number) => {
    if (!confirm("Удалить этот код?")) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/v1/admin/codes/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        setError("Ошибка удаления кода");
        return;
      }
      
      setSuccess("Код удален!");
      loadCodes();
    } catch {
      setError("Ошибка удаления кода");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const activeCodes = codes.filter(c => c.status === "active").length;
  const usedCodes = codes.filter(c => c.status === "used").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-8 h-8" />
            Управление кодами
          </h1>
          <p className="text-gray-600 mt-1">Создание и управление кодами активации</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Zap className="w-4 h-4" />
                Сгенерировать коды
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Генерация кодов</DialogTitle>
                <DialogDescription>
                  Сгенерируйте несколько кодов одновременно
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="generate-count">Количество кодов</Label>
                  <Input
                    id="generate-count"
                    type="number"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Number(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generate-nominal">Номинал (Robux)</Label>
                  <Input
                    id="generate-nominal"
                    type="number"
                    value={generateNominal}
                    onChange={(e) => setGenerateNominal(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generate-product-type">Игра</Label>
                  <Select value={generateProductType} onValueChange={updateGenerateType}>
                    <SelectTrigger id="generate-product-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roblox">Roblox</SelectItem>
                      <SelectItem value="fortnite">Fortnite</SelectItem>
                      <SelectItem value="pubg">PUBG</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generate-prefix">Префикс</Label>
                  <Input
                    id="generate-prefix"
                    type="text"
                    value={generatePrefix}
                    onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())}
                    placeholder="RBX100"
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={generateCodes}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Сгенерировать {generateCount} кодов
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить код
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новый код</DialogTitle>
              <DialogDescription>
                Создайте новый код активации для системы
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-code">Код активации</Label>
                <Input
                  id="new-code"
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="RBX100-XXXX-XXXX"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nominal">Номинал (Robux)</Label>
                <Input
                  id="new-nominal"
                  type="number"
                  value={newNominal}
                  onChange={(e) => setNewNominal(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-product-type">Игра</Label>
                <Select value={newProductType} onValueChange={setNewProductType}>
                  <SelectTrigger id="new-product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roblox">Roblox</SelectItem>
                    <SelectItem value="fortnite">Fortnite</SelectItem>
                    <SelectItem value="pubg">PUBG</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={addCode}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Добавление...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Добавить код
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{activeCodes}</div>
                <div className="text-sm text-green-700">Активных кодов</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{usedCodes}</div>
                <div className="text-sm text-red-700">Использованных кодов</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{codes.length}</div>
                <div className="text-sm text-blue-700">Всего кодов</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Generated Codes */}
      {generatedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Сгенерированные коды
                </CardTitle>
                <CardDescription>
                  {generatedCodes.length} кодов номиналом {generateNominal} Robux
                </CardDescription>
              </div>
              <Button onClick={downloadCodes} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Скачать
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {generatedCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm bg-white p-2 rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список кодов</CardTitle>
          <CardDescription>
            Все коды активации в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Загрузка...</span>
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Коды не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Номинал</TableHead>
                    <TableHead>Игра</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Использован</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{code.nominal} Robux</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {code.product_type ?? "roblox"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={code.status === "active" ? "default" : "secondary"}
                          className={code.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                          }
                        >
                          {code.status === "active" ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Активен
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Использован
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {code.used_at ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(code.used_at).toLocaleString("ru-RU")}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.status === "active" && (
                          <Button
                            onClick={() => deleteCode(code.id)}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
