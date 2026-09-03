"use client";

import { Users, Plus, Edit, Phone, User, Tag, Loader2 } from "lucide-react";
import { useState } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VantaBackgroundLayout } from "@/components/layout/vanta";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ContactService
} from "@/services/contacts-service";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Contact, CreateContactData, UpdateContactData } from "@/types/contact";

// Type definitions - imported from service

export default function ContactsPage() {
  const [phoneFilter, setPhoneFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    source: "",
    phone: "",
    username: "",
    notes: "",
    tags: "",
  });

  // React Query hooks
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["contacts", phoneFilter, usernameFilter],
    queryFn: ({ pageParam = 1 }) =>
      ContactService.getContacts(
        pageParam,
        20,
        phoneFilter || undefined,
        usernameFilter || undefined
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContactData) =>
      ContactService.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({
        title: "Éxito",
        description: "Contacto creado correctamente",
      });
      resetForm();
      setActiveTab("list");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactData }) =>
      ContactService.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({
        title: "Éxito",
        description: "Contacto actualizado correctamente",
      });
      resetForm();
      setActiveTab("list");
      setEditingContact(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Flatten contacts from all pages
  const contacts = data?.pages.flatMap((page) => page.contacts) || [];

  const resetForm = () => {
    setFormData({
      source: "",
      phone: "",
      username: "",
      notes: "",
      tags: "",
    });
    setEditingContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      source: contact.source,
      phone: contact.phone,
      username: contact.username,
      notes: contact.notes,
      tags: contact.tags,
    });
    setActiveTab("create");
  };

  const handleSaveContact = async () => {
    if (editingContact) {
      // Update existing contact
      const updateData = {
        source: formData.source,
        phone: formData.phone,
        username: formData.username,
        notes: formData.notes,
        tags: formData.tags,
      };
      await updateMutation.mutateAsync({
        id: editingContact._id,
        data: updateData,
      });
    } else {
      // Create new contact
      const contactData: CreateContactData = {
        source: formData.source,
        phone: formData.phone,
        username: formData.username,
        notes: formData.notes,
        tags: formData.tags,
      };
      await createMutation.mutateAsync(contactData);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setActiveTab("list");
  };

  // Loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <VantaBackgroundLayout>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando contactos...</p>
          </div>
        </VantaBackgroundLayout>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <VantaBackgroundLayout>
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar los contactos</div>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </div>
        </VantaBackgroundLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <VantaBackgroundLayout>
        <div className="relative z-10">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 text-balance bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]">
                Gestión de Contactos
              </h1>
              <p className="text-emerald-300/90 text-lg text-pretty drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                Administra tu base de contactos y clientes
              </p>
            </div>

            {/* Main Card */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(37,211,102,0.3)]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-emerald-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(37,211,102,0.5)] flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Base de Contactos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="create">
                      {editingContact ? "Editar" : "Crear"}
                    </TabsTrigger>
                  </TabsList>

                  {/* List Tab */}
                  <TabsContent value="list" className="space-y-4">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filtrar por teléfono..."
                          value={phoneFilter}
                          onChange={(e) => setPhoneFilter(e.target.value)}
                          className="pl-10 border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                        />
                      </div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filtrar por usuario..."
                          value={usernameFilter}
                          onChange={(e) => setUsernameFilter(e.target.value)}
                          className="pl-10 border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setPhoneFilter("");
                            setUsernameFilter("");
                          }}
                          variant="outline"
                          className="flex-1 border-primary/30 hover:border-primary"
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-primary/30 overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-primary/30 hover:bg-primary/5">
                              <TableHead className="text-emerald-200/90">
                                Usuario
                              </TableHead>
                              <TableHead className="text-emerald-200/90">
                                Teléfono
                              </TableHead>
                              <TableHead className="text-emerald-200/90">
                                Origen
                              </TableHead>
                              <TableHead className="text-emerald-200/90">
                                Tags
                              </TableHead>
{/*                               <TableHead className="text-emerald-200/90">
                                Notas
                              </TableHead> */}
                              <TableHead className="text-emerald-200/90">
                                Fecha
                              </TableHead>
                              <TableHead className="text-emerald-200/90 text-right">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.map((contact) => (
                              <TableRow
                                key={contact._id}
                                className="border-primary/20 hover:bg-primary/5 transition-colors"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <span className="font-medium">
                                      {contact.username}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      {contact.phone}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className=" text-xs"
                                  >
                                    {contact.source}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {contact.tags ? (
                                    <div className="flex flex-wrap gap-1">
                                      {contact.tags
                                        .split(",")
                                        .map((tag, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag.trim()}
                                          </Badge>
                                        ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
{/*                                 <TableCell className="max-w-xs">
                                  {contact.notes ? (
                                    <span className="text-sm truncate block">
                                      {contact.notes}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell> */}
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {formatDate(contact.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                      onClick={() => handleEditContact(contact)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Load More Button */}
                    {hasNextPage && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          variant="outline"
                          className="border-primary/30 hover:border-primary"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            "Cargar más contactos"
                          )}
                        </Button>
                      </div>
                    )}

                    {contacts.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No se encontraron contactos
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Create Tab */}
                  <TabsContent value="create" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Username */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="username"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Usuario
                        </Label>
                        <Input
                          id="username"
                          placeholder="NombreUsuario123"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="phone"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Teléfono
                        </Label>
                        <Input
                          id="phone"
                          placeholder="5491123456789"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all "
                        />
                      </div>

                      {/* Source */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="source"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Origen
                        </Label>
                        <Input
                          id="source"
                          placeholder="admin-invite"
                          value={formData.source}
                          onChange={(e) =>
                            setFormData({ ...formData, source: e.target.value })
                          }
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                          Fuente de donde proviene el contacto
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="tags"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Tags
                        </Label>
                        <Input
                          id="tags"
                          placeholder="vip, premium, cliente"
                          value={formData.tags}
                          onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                          }
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                          Etiquetas separadas por comas
                        </p>
                      </div>

                      {/* Notes */}
                      <div className="space-y-3 md:col-span-2">
                        <Label
                          htmlFor="notes"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Notas
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Información adicional sobre el contacto..."
                          rows={4}
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-primary/50 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all bg-transparent"
                        onClick={
                          editingContact
                            ? handleCancelEdit
                            : () => {
                                resetForm();
                                setActiveTab("list");
                              }
                        }
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] transition-all"
                        onClick={handleSaveContact}
                        disabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                      >
                        {createMutation.isPending ||
                        updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : editingContact ? (
                          <Edit className="h-4 w-4 mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {createMutation.isPending || updateMutation.isPending
                          ? editingContact
                            ? "Actualizando..."
                            : "Creando..."
                          : editingContact
                          ? "Actualizar Contacto"
                          : "Crear Contacto"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </VantaBackgroundLayout>
    </ProtectedRoute>
  );
}
