import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Key, 
  Upload, 
  LogOut, 
  Settings,
  Warehouse
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value || null;
  const ok = verifyAdminToken(token);
  if (!ok.ok) {
    redirect("/admin-login");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RBXPass Admin</h1>
                <p className="text-xs text-gray-500">Панель управления</p>
              </div>
            </div>
            <form action="/api/v1/admin/logout" method="post">
              <Button 
                type="submit" 
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <nav className="flex flex-wrap gap-2">
              <Button 
                asChild
                variant="outline"
                className="gap-2"
              >
                <a href="/admin/orders">
                  <Package className="w-4 h-4" />
                  Заказы
                </a>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="gap-2"
              >
                <a href="/admin/codes">
                  <Key className="w-4 h-4" />
                  Коды
                </a>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="gap-2"
              >
                <a href="/admin/import">
                  <Upload className="w-4 h-4" />
                  Импорт
                </a>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="gap-2"
              >
                <a href="/admin/yandex">
                  <Warehouse className="w-4 h-4" />
                  Яндекс склад
                </a>
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


