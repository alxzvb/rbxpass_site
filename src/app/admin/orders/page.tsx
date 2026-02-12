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
import { 
  Package, 
  Search, 
  RefreshCw, 
  Download, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react";

type Order = {
  id: number;
  short_code: string;
  code: string;
  nickname: string;
  user_id: string;
  gamepass_id: string;
  gamepass_url: string;
  product_type?: string | null;
  contact_telegram?: string | null;
  epic_login?: string | null;
  epic_password?: string | null;
  status: string;
  created_at: string;
};

const statusConfig = {
  queued: {
    label: "В очереди",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock
  },
  processing: {
    label: "В обработке",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2
  },
  done: {
    label: "Выполнен",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle
  },
  error: {
    label: "Ошибка",
    color: "bg-red-100 text-red-800",
    icon: XCircle
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [productType, setProductType] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<number>>(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q });
      if (status && status !== "all") {
        params.append("status", status);
      }
      if (productType && productType !== "all") {
        params.append("productType", productType);
      }
      const url = `/api/v1/admin/orders?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setError("Ошибка загрузки заказов");
        return;
      }
      const data = await res.json();
      setOrders(data.orders);
      setSelectedOrderIds((prev) => {
        const next = new Set<number>();
        const availableIds = new Set<number>(data.orders.map((o: Order) => o.id));
        prev.forEach((id) => {
          if (availableIds.has(id)) next.add(id);
        });
        return next;
      });
    } catch {
      setError("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }, [q, status, productType]);

  async function updateStatus(id: number, s: string) {
    const current = orders.find((order) => order.id === id);
    if (!current || current.status === s) return;

    const previousStatus = current.status;
    setError(null);
    setUpdatingOrderIds((prev) => new Set(prev).add(id));
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: s } : order))
    );

    try {
      const res = await fetch(`/api/v1/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (!res.ok) throw new Error("patch_failed");
    } catch {
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status: previousStatus } : order))
      );
      setError(`Не удалось обновить статус заказа #${id}`);
    } finally {
      setUpdatingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function toggleOrderSelection(id: number, checked: boolean) {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedOrderIds(new Set(orders.map((order) => order.id)));
      return;
    }
    setSelectedOrderIds(new Set());
  }

  async function markSelectedAsProcessing() {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;

    const previousStatuses = new Map<number, string>();
    orders.forEach((order) => {
      if (ids.includes(order.id)) {
        previousStatuses.set(order.id, order.status);
      }
    });

    setError(null);
    setBulkUpdating(true);
    setUpdatingOrderIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setOrders((prev) =>
      prev.map((order) =>
        selectedOrderIds.has(order.id) ? { ...order, status: "processing" } : order
      )
    );

    const failedIds: number[] = [];
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/v1/admin/orders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "processing" }),
          });
          if (!res.ok) throw new Error("patch_failed");
        } catch {
          failedIds.push(id);
        }
      })
    );

    if (failedIds.length > 0) {
      setOrders((prev) =>
        prev.map((order) =>
          failedIds.includes(order.id)
            ? { ...order, status: previousStatuses.get(order.id) ?? order.status }
            : order
        )
      );
      setError(`Часть заказов не обновилась (${failedIds.length} шт.)`);
      setSelectedOrderIds(new Set(failedIds));
    } else {
      setSelectedOrderIds(new Set());
    }

    setUpdatingOrderIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setBulkUpdating(false);
  }

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: orders.length,
    queued: orders.filter(o => o.status === "queued").length,
    processing: orders.filter(o => o.status === "processing").length,
    done: orders.filter(o => o.status === "done").length,
    error: orders.filter(o => o.status === "error").length,
  };

  const allSelected = orders.length > 0 && orders.every((order) => selectedOrderIds.has(order.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Управление заказами
          </h1>
          <p className="text-gray-600 mt-1">Просмотр и управление заказами активации</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={load}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Обновление..." : "Обновить"}
          </Button>
          <Button 
            asChild
            className="gap-2"
          >
            <a href="/api/v1/admin/export/orders" target="_blank">
              <Download className="w-4 h-4" />
              Экспорт CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Всего заказов</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.queued}</div>
                <div className="text-sm text-yellow-700">В очереди</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <div className="text-sm text-blue-700">В обработке</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                <div className="text-sm text-green-700">Выполнено</div>
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
                <div className="text-2xl font-bold text-red-600">{stats.error}</div>
                <div className="text-sm text-red-700">Ошибки</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  id="search"
                  placeholder="Поиск по коду, нику или ID..." 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="queued">В очереди</SelectItem>
                  <SelectItem value="processing">В обработке</SelectItem>
                  <SelectItem value="done">Выполнен</SelectItem>
                  <SelectItem value="error">Ошибка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-type-filter">Игра</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Все игры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все игры</SelectItem>
                  <SelectItem value="roblox">Roblox</SelectItem>
                  <SelectItem value="fortnite">Fortnite</SelectItem>
                  <SelectItem value="pubg">PUBG</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => { setQ(""); setStatus("all"); setProductType("all"); }}
                variant="outline"
                className="w-full"
              >
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
          <CardDescription>
            {orders.length} заказ(ов) найдено
          </CardDescription>
          <div className="pt-2">
            <Button
              onClick={markSelectedAsProcessing}
              disabled={bulkUpdating || selectedOrderIds.size === 0}
              className="gap-2"
            >
              {bulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Перевести выбранные в обработку
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Загрузка...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Заказы не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        aria-label="Выбрать все заказы на странице"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Игра</TableHead>
                    <TableHead>GamePass</TableHead>
                    <TableHead>Данные</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || Clock;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(order.id)}
                            onChange={(e) => toggleOrderSelection(order.id, e.target.checked)}
                            aria-label={`Выбрать заказ #${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm">{order.short_code}</div>
                            <div className="text-xs text-gray-500">{order.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order.nickname}</div>
                            <div className="text-xs text-gray-500">ID: {order.user_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.product_type ?? "roblox"}</Badge>
                        </TableCell>
                        <TableCell>
                          {order.gamepass_url && order.gamepass_url !== "-" ? (
                          <a 
                            href={order.gamepass_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                          >
                            {order.gamepass_id}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {order.contact_telegram && (
                              <div className="text-gray-700">
                                <span className="font-medium">TG:</span> {order.contact_telegram}
                              </div>
                            )}
                            {order.epic_login && (
                              <div className="text-gray-700">
                                <span className="font-medium">Epic:</span> {order.epic_login}
                              </div>
                            )}
                            {order.epic_password && (
                              <div className="text-gray-500 text-xs">
                                <span className="font-medium">Пароль:</span> ••••••••
                              </div>
                            )}
                            {!order.contact_telegram && !order.epic_login && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => updateStatus(order.id, value)}
                            disabled={updatingOrderIds.has(order.id)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="queued">В очереди</SelectItem>
                              <SelectItem value="processing">В обработке</SelectItem>
                              <SelectItem value="done">Выполнен</SelectItem>
                              <SelectItem value="error">Ошибка</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


