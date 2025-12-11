"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image';
import { Home, Search, BookOpen, Shield, PlayCircle, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavigationProps {
  currentPage?: string;
}

export function Navigation({ currentPage }: NavigationProps) {
  const getPageTitle = () => {
    switch (currentPage) {
      case "instructions":
        return "Инструкция по GamePass";
      case "status":
        return "Статус заказа";
      default:
        return "Активация Robux";
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Image
                src="/images/logo.jpg" 
                alt="RBXPass"
                width={100} 
                height={40} 
                className="primary-logo w-10 h-10 rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RBXPass</h1>
              <p className="text-xs text-gray-500">{getPageTitle()}</p>
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex gap-2">
            {currentPage !== "home" && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href="https://rutube.ru/video/a2652268ba8a379f99c77eecb5ac7745/"
                  className="flex items-center gap-1"
                >
                  <PlayCircle className="w-3 h-3" />
                  Видеоинструкция
                </Link>
              </Button>
            )}
            {currentPage !== "home" && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href="https://t.me/loothub_support"
                  className="flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Поддержка
                </Link>
              </Button>
            )}
            {currentPage !== "home" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/" className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Главная
                </Link>
              </Button>
            )}
            {currentPage !== "instructions" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/instructions" className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Инструкция
                </Link>
              </Button>
            )}
            {currentPage !== "status" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/status" className="flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Статус
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Открыть меню">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-4">
                <SheetTitle className="text-lg font-semibold mb-4">
                  Меню навигации
                </SheetTitle>
                <div className="flex flex-col gap-2">
                  {currentPage !== "home" && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Главная
                      </Link>
                    </Button>
                  )}
                  {currentPage !== "instructions" && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href="/instructions"
                        className="flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Инструкция
                      </Link>
                    </Button>
                  )}
                  {currentPage !== "status" && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/status" className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Статус
                      </Link>
                    </Button>
                  )}
                  {currentPage !== "home" && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href="https://rutube.ru/video/a2652268ba8a379f99c77eecb5ac7745/"
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Видеоинструкция
                      </Link>
                    </Button>
                  )}
                  {currentPage !== "home" && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href="https://t.me/loothub_support"
                        className="flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Поддержка
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}