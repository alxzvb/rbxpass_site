"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Link2,
  Upload,
  Database,
  FileText,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Product = {
  id: number;
  title: string;
  productKey: string;
  createdAt: string;
  available?: number;
};

type OfferMap = {
  id: number;
  offerId: string;
  productId: number;
  product: {
    id: number;
    title: string;
    productKey: string;
  };
};

type StockItem = {
  productId: number;
  title: string;
  productKey: string;
  available: number;
  reserved: number;
  delivered: number;
  total: number;
};

type DeliveryLog = {
  id: number;
  orderId: string;
  itemId: string;
  codeId: number;
  createdAt: string;
  code: {
    codeText: string;
    product: {
      title: string;
    };
  };
};

export default function AdminYandex() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offerMaps, setOfferMaps] = useState<OfferMap[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Product form
  const [productTitle, setProductTitle] = useState("");
  const [productKey, setProductKey] = useState("");

  // OfferMap form
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [offerId, setOfferId] = useState("");

  // Code upload form
  const [uploadProductId, setUploadProductId] = useState<string>("");
  const [codesText, setCodesText] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError("Ошибка загрузки продуктов");
    }
  };

  const fetchOfferMaps = async () => {
    try {
      const res = await fetch("/api/admin/offermap");
      if (!res.ok) throw new Error("Failed to fetch offer maps");
      const data = await res.json();
      setOfferMaps(data.offerMaps || []);
    } catch (err) {
      setError("Ошибка загрузки привязок");
    }
  };

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/admin/stock");
      if (!res.ok) throw new Error("Failed to fetch stock");
      const data = await res.json();
      setStock(data.stock || []);
    } catch (err) {
      setError("Ошибка загрузки остатков");
    }
  };

  const fetchDeliveryLogs = async () => {
    try {
      // We'll need to create this endpoint
      const res = await fetch("/api/admin/delivery-logs");
      if (!res.ok) {
        if (res.status === 404) {
          setDeliveryLogs([]);
          return;
        }
        throw new Error("Failed to fetch delivery logs");
      }
      const data = await res.json();
      setDeliveryLogs(data.logs || []);
    } catch (err) {
      // Endpoint might not exist yet, that's ok
      setDeliveryLogs([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOfferMaps();
    fetchStock();
    fetchDeliveryLogs();
  }, []);

  const handleCreateProduct = async () => {
    if (!productTitle || !productKey) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: productTitle, productKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка создания продукта");
      }

      setSuccess("Продукт создан");
      setProductTitle("");
      setProductKey("");
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания продукта");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfferMap = async () => {
    if (!selectedProductId || !offerId) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/offermap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(selectedProductId),
          offerId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка создания привязки");
      }

      setSuccess("Привязка создана");
      setSelectedProductId("");
      setOfferId("");
      await fetchOfferMaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания привязки");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCodes = async () => {
    if (!uploadProductId || !codesText.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/codes/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(uploadProductId),
          codes: codesText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки кодов");
      }

      const data = await res.json();
      setSuccess(`Загружено кодов: ${data.created} из ${data.total}`);
      setCodesText("");
      await fetchStock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки кодов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Яндекс склад</h1>
          <p className="text-muted-foreground mt-1">Управление продуктами и кодами для Яндекс Маркета</p>
        </div>
        <Button onClick={() => {
          fetchProducts();
          fetchOfferMaps();
          fetchStock();
          fetchDeliveryLogs();
        }} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Продукты
          </TabsTrigger>
          <TabsTrigger value="offermap">
            <Link2 className="h-4 w-4 mr-2" />
            Привязка offerId
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Загрузка кодов
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Database className="h-4 w-4 mr-2" />
            Остатки
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Журнал выдач
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Создать продукт</CardTitle>
              <CardDescription>Добавьте новый продукт для Яндекс Маркета</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-title">Название</Label>
                <Input
                  id="product-title"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Например: Roblox 1000 Robux"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-key">Ключ продукта</Label>
                <Input
                  id="product-key"
                  value={productKey}
                  onChange={(e) => setProductKey(e.target.value)}
                  placeholder="Например: roblox-1000"
                />
              </div>
              <Button onClick={handleCreateProduct} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Создать
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Список продуктов</CardTitle>
              <CardDescription>Все продукты в системе</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Ключ</TableHead>
                    <TableHead>Доступно кодов</TableHead>
                    <TableHead>Создан</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Нет продуктов
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.productKey}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.available ?? 0}</Badge>
                        </TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString("ru-RU")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offermap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Создать привязку</CardTitle>
              <CardDescription>Привяжите offerId из Яндекс Маркета к продукту</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offermap-product">Продукт</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="offermap-product">
                    <SelectValue placeholder="Выберите продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.title} ({product.productKey})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offermap-offerid">Offer ID</Label>
                <Input
                  id="offermap-offerid"
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  placeholder="Например: 12345678"
                />
              </div>
              <Button onClick={handleCreateOfferMap} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Создать привязку
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Список привязок</CardTitle>
              <CardDescription>Все привязки offerId к продуктам</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Offer ID</TableHead>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Ключ продукта</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerMaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Нет привязок
                      </TableCell>
                    </TableRow>
                  ) : (
                    offerMaps.map((map) => (
                      <TableRow key={map.id}>
                        <TableCell>{map.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{map.offerId}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{map.product.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{map.product.productKey}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Загрузить коды</CardTitle>
              <CardDescription>Загрузите коды для продукта (по одному в строке)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-product">Продукт</Label>
                <Select value={uploadProductId} onValueChange={setUploadProductId}>
                  <SelectTrigger id="upload-product">
                    <SelectValue placeholder="Выберите продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.title} ({product.productKey})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-codes">Коды</Label>
                <Textarea
                  id="upload-codes"
                  value={codesText}
                  onChange={(e) => setCodesText(e.target.value)}
                  placeholder="Введите коды, по одному в строке:&#10;CODE1&#10;CODE2&#10;CODE3"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleUploadCodes} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Загрузить коды
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Остатки</CardTitle>
              <CardDescription>Текущие остатки кодов по продуктам</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Ключ</TableHead>
                    <TableHead>Доступно</TableHead>
                    <TableHead>Зарезервировано</TableHead>
                    <TableHead>Выдано</TableHead>
                    <TableHead>Всего</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    stock.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.productKey}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">{item.available}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-yellow-600">{item.reserved}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-blue-600">{item.delivered}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.total}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Журнал выдач</CardTitle>
              <CardDescription>История выдачи кодов через Яндекс Маркет</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Нет записей о выдаче
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Продукт</TableHead>
                      <TableHead>Код</TableHead>
                      <TableHead>Дата выдачи</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.orderId}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.itemId}</Badge>
                        </TableCell>
                        <TableCell>{log.code.product.title}</TableCell>
                        <TableCell className="font-mono text-sm">{log.code.codeText}</TableCell>
                        <TableCell>{new Date(log.createdAt).toLocaleString("ru-RU")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
