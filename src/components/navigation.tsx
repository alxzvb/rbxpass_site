import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Home, 
  Search, 
  Gamepad2, 
  BookOpen,
  Shield, 
  PlayCircle,
} from "lucide-react";

interface NavigationProps {
  currentPage?: string;
}

export function Navigation({ currentPage }: NavigationProps) {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'instructions': return 'Инструкция по GamePass';
      case 'status': return 'Статус заказа';
      default: return 'Активация Robux';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎮</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RBXPass</h1>
              <p className="text-xs text-gray-500">
                {getPageTitle()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
{currentPage !== 'home' && (
<Button asChild variant="outline" size="sm">
<Link href="https://rutube.ru/video/a2652268ba8a379f99c77eecb5ac7745/" className="flex items-center gap-1">
<PlayCircle className="w-3 h-3" />
Видеоинструкция
</Link>
</Button>
)}
            {currentPage !== 'home' && (
              <Button asChild variant="outline" size="sm">
                <Link href="https://t.me/loothub_support" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Поддержка
                </Link>
              </Button>
            )}
            {currentPage !== 'home' && (
              <Button asChild variant="outline" size="sm">
                <Link href="/" className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Главная
                </Link>
              </Button>
            )}
            {currentPage !== 'instructions' && (
              <Button asChild variant="outline" size="sm">
                <Link href="/instructions" className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Инструкция
                </Link>
              </Button>
            )}
            {currentPage !== 'status' && (
              <Button asChild variant="outline" size="sm">
                <Link href="/status" className="flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Статус
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
