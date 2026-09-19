"use client";

import { useState } from "react";
import {
  IdCard,
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Undo2,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { VantaBackgroundLayout } from "@/components/layout/vanta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";
import {
  AccountsService,
  AccountStatus,
  ImportSummary,
  PlatformAccount,
} from "@/services/accounts-service";

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground";

function fecha(valor?: string | null) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function BadgeStatus({ status }: { status: AccountStatus }) {
  const estilos: Record<AccountStatus, string> = {
    disponible: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    entregado: "bg-sky-500/15 text-sky-400 border-sky-500/40",
    anulado: "bg-red-500/15 text-red-400 border-red-500/40",
  };
  const etiquetas: Record<AccountStatus, string> = {
    disponible: "open",
    entregado: "entregado",
    anulado: "anulado",
  };
  return (
    <Badge variant="outline" className={estilos[status]}>
      {etiquetas[status]}
    </Badge>
  );
}

export default function RegistrosPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [umbral, setUmbral] = useState(10);
  const [plataforma, setPlataforma] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [usuario, setUsuario] = useState("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [verPasswords, setVerPasswords] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resumen, setResumen] = useState<ImportSummary | null>(null);

  const stockQuery = useQuery({
    queryKey: ["accounts-stock", umbral],
    queryFn: () => AccountsService.getStock(umbral),
    refetchInterval: 60000,
  });

  const listQuery = useQuery({
    queryKey: ["accounts-list", plataforma, status, usuario, phone, page, verPasswords],
    queryFn: () =>
      AccountsService.list({
        plataforma,
        status,
        usuario,
        phone,
        page,
        limit: 20,
        includePassword: verPasswords,
      }),
  });

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts-stock"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
  };

  const importMutation = useMutation({
    mutationFn: (file: File) => AccountsService.importFile(file, user?.email || undefined),
    onSuccess: (data) => {
      setResumen(data);
      setArchivo(null);
      refrescar();
      toast({
        title: `Importación lista: ${data.insertados} cuentas nuevas`,
        description:
          data.duplicadosEnBase.length || data.duplicadosEnArchivo.length || data.errores.length
            ? `${data.duplicadosEnBase.length + data.duplicadosEnArchivo.length} duplicadas · ${data.errores.length} con error`
            : "Sin duplicados ni errores",
      });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo importar", description: error.message, variant: "destructive" });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (cuenta: PlatformAccount) =>
      AccountsService.release(cuenta._id, "liberada desde el panel", user?.email || undefined),
    onSuccess: () => {
      refrescar();
      toast({ title: "Cuenta liberada", description: "Volvió al pool como disponible." });
    },
    onError: (error: Error) =>
      toast({ title: "No se pudo liberar", description: error.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ cuenta, nuevo }: { cuenta: PlatformAccount; nuevo: AccountStatus }) =>
      AccountsService.update(cuenta._id, { status: nuevo }),
    onSuccess: () => {
      refrescar();
      toast({ title: "Estado actualizado" });
    },
    onError: (error: Error) =>
      toast({ title: "No se pudo actualizar", description: error.message, variant: "destructive" }),
  });

  const stock = stockQuery.data;
  const cuentas = listQuery.data?.accounts || [];
  const paginacion = listQuery.data?.pagination;

  return (
    <ProtectedRoute>
      <VantaBackgroundLayout>
        <div className="relative z-10">
          <main className="container mx-auto px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]">
                  Registros
                </h1>
                <p className="text-muted-foreground">
                  Cuentas precargadas que el chat entrega automáticamente
                </p>
              </div>

              {/* ---------------------------------------------------- stock */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-primary" /> Stock por plataforma
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="umbral" className="text-xs text-muted-foreground">
                    Avisar cuando queden
                  </Label>
                  <Input
                    id="umbral"
                    type="number"
                    min={0}
                    value={umbral}
                    onChange={(e) => setUmbral(Number(e.target.value) || 0)}
                    className="w-20 h-9"
                  />
                  <Button variant="ghost" size="icon" onClick={refrescar} title="Actualizar">
                    <RefreshCw className={`h-4 w-4 ${stockQuery.isFetching ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {stockQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : stock && stock.plataformas.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                  {stock.plataformas.map((p) => (
                    <Card
                      key={p.plataforma}
                      className={`bg-card/60 backdrop-blur-xl border ${
                        p.sinStock
                          ? "border-red-500/60"
                          : p.stockBajo
                          ? "border-amber-500/60"
                          : "border-border/50"
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between gap-2">
                          <span className="truncate">{p.plataforma}</span>
                          {p.sinStock ? (
                            <Badge variant="outline" className="border-red-500/60 text-red-400 shrink-0">
                              sin stock
                            </Badge>
                          ) : p.stockBajo ? (
                            <Badge variant="outline" className="border-amber-500/60 text-amber-400 shrink-0">
                              stock bajo
                            </Badge>
                          ) : null}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{p.disponible}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          disponibles · {p.entregado} entregadas · {p.total} en total
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-card/60 backdrop-blur-xl mb-10">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Todavía no hay cuentas cargadas. Importá el Excel desde la pestaña de abajo.
                  </CardContent>
                </Card>
              )}

              {/* --------------------------------------------------- tabs */}
              <Tabs defaultValue="listado">
                <TabsList className="mb-6">
                  <TabsTrigger value="listado">Listado</TabsTrigger>
                  <TabsTrigger value="importar">Importar Excel</TabsTrigger>
                </TabsList>

                {/* ------------------------------------------------ listado */}
                <TabsContent value="listado">
                  <Card className="bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">Cuentas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                        <div>
                          <Label className="text-xs">Plataforma</Label>
                          <select
                            className={SELECT_CLASS}
                            value={plataforma}
                            onChange={(e) => {
                              setPlataforma(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">Todas</option>
                            {(stock?.plataformas || []).map((p) => (
                              <option key={p.plataforma} value={p.plataforma}>
                                {p.plataforma}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Estado</Label>
                          <select
                            className={SELECT_CLASS}
                            value={status}
                            onChange={(e) => {
                              setStatus(e.target.value as AccountStatus | "");
                              setPage(1);
                            }}
                          >
                            <option value="">Todos</option>
                            <option value="disponible">open (disponible)</option>
                            <option value="entregado">entregado</option>
                            <option value="anulado">anulado</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Usuario</Label>
                          <Input
                            value={usuario}
                            onChange={(e) => {
                              setUsuario(e.target.value);
                              setPage(1);
                            }}
                            placeholder="buscar usuario"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Teléfono</Label>
                          <Input
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              setPage(1);
                            }}
                            placeholder="buscar teléfono"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setVerPasswords((v) => !v)}
                          >
                            {verPasswords ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" /> Ocultar claves
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" /> Ver claves
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {listQuery.isLoading ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : listQuery.isError ? (
                        <div className="text-center py-10 text-red-400">
                          {(listQuery.error as Error).message}
                        </div>
                      ) : cuentas.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          No hay cuentas con esos filtros.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuario</TableHead>
                                {verPasswords && <TableHead>Contraseña</TableHead>}
                                <TableHead>Plataforma</TableHead>
                                <TableHead>Panel</TableHead>
                                <TableHead>Operador</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Entregada</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cuentas.map((c) => (
                                <TableRow key={c._id}>
                                  <TableCell className="font-medium">{c.usuario}</TableCell>
                                  {verPasswords && (
                                    <TableCell className="font-mono text-xs">{c.password || "—"}</TableCell>
                                  )}
                                  <TableCell>{c.plataforma}</TableCell>
                                  <TableCell className="text-muted-foreground">{c.panel || "—"}</TableCell>
                                  <TableCell className="text-muted-foreground">{c.operador || "—"}</TableCell>
                                  <TableCell>
                                    <BadgeStatus status={c.status} />
                                  </TableCell>
                                  <TableCell>{c.phone || "—"}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {fecha(c.deliveredAt)}
                                  </TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    {c.status === "entregado" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Liberar: vuelve al pool"
                                        onClick={() => releaseMutation.mutate(c)}
                                        disabled={releaseMutation.isPending}
                                      >
                                        <Undo2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {c.status !== "anulado" ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Anular"
                                        onClick={() =>
                                          statusMutation.mutate({ cuenta: c, nuevo: "anulado" })
                                        }
                                        disabled={statusMutation.isPending}
                                      >
                                        <Ban className="h-4 w-4 text-red-400" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Reactivar"
                                        onClick={() =>
                                          statusMutation.mutate({ cuenta: c, nuevo: "disponible" })
                                        }
                                        disabled={statusMutation.isPending}
                                      >
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {paginacion && paginacion.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <span className="text-xs text-muted-foreground">
                            Página {paginacion.currentPage} de {paginacion.totalPages} ·{" "}
                            {paginacion.totalCount} cuentas
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!paginacion.hasPrevPage}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!paginacion.hasNextPage}
                              onClick={() => setPage((p) => p + 1)}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ----------------------------------------------- importar */}
                <TabsContent value="importar">
                  <Card className="bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" /> Importar cuentas desde Excel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          El archivo (.xlsx o .csv) tiene que tener estas columnas, en cualquier orden:{" "}
                          <span className="text-foreground font-medium">
                            operador, panel, usuario, password, fecha y hora de registro, plataforma, status
                          </span>
                          .
                        </p>
                        <p>
                          El status vacío se toma como <span className="text-foreground">open</span>. Si un
                          usuario ya existe para esa plataforma, la fila se ignora: podés reimportar el mismo
                          archivo sin duplicar nada.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <Input
                          type="file"
                          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                          onChange={(e) => {
                            setArchivo(e.target.files?.[0] || null);
                            setResumen(null);
                          }}
                          className="sm:max-w-md"
                        />
                        <Button
                          onClick={() => archivo && importMutation.mutate(archivo)}
                          disabled={!archivo || importMutation.isPending}
                        >
                          {importMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" /> Importar
                            </>
                          )}
                        </Button>
                      </div>

                      {resumen && (
                        <div className="rounded-lg border border-border/60 p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-emerald-400">
                                {resumen.insertados}
                              </div>
                              <div className="text-xs text-muted-foreground">nuevas</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-sky-400">
                                {resumen.duplicadosEnBase.length + resumen.duplicadosEnArchivo.length}
                              </div>
                              <div className="text-xs text-muted-foreground">duplicadas</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-400">
                                {resumen.errores.length}
                              </div>
                              <div className="text-xs text-muted-foreground">con error</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">{resumen.totalFilas}</div>
                              <div className="text-xs text-muted-foreground">filas leídas</div>
                            </div>
                          </div>

                          {resumen.errores.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-amber-400 text-sm">
                                <AlertTriangle className="h-4 w-4" /> Filas que no entraron:
                              </div>
                              <ul className="text-xs text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
                                {resumen.errores.map((e, i) => (
                                  <li key={i}>
                                    Fila {e.fila}: {e.motivo}
                                    {e.usuario ? ` (${e.usuario})` : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </VantaBackgroundLayout>
    </ProtectedRoute>
  );
}
