export type ProgramacionPonencia = {
  id: string;
  fecha: string;
  inicio: string;
  fin: string;
  salon?: {
    id: string;
    nombre: string;
    capacidadPonente: number;
    activo: boolean;
  } | null;
};

export type PonenciaEvaluacion = {
  id: string;
  puntaje?: number | null;
  concepto?: string | null;
  observaciones?: string | null;
  decision?: string | null;
  estado: string;
  evaluador?: {
    id: string;
    nombres: string;
    apellidos: string;
    documento: string;
    email: string;
  } | null;
};

export type PonenteAsignacion = {
  id: string;
  activo: boolean;
  evaluador?: {
    id: string;
    nombres: string;
    apellidos: string;
    documento: string;
    email: string;
    universidad?: string | null;
  } | null;
  evaluacion?: PonenciaEvaluacion | null;
};

export type PonenteAdmin = {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono: string;

  nombres2?: string | null;
  apellidos2?: string | null;
  tipoDocumento2?: string | null;
  documento2?: string | null;
  email2?: string | null;
  telefono2?: string | null;

  pais: string;
  ciudad: string;

  universidad?: string | null;
  programa?: string | null;
  semestre?: string | null;

  grupoInvestigacion?: string | null;
  semillero?: string | null;

  tituloPonencia: string;
  resumen: string;
  lineaTematica: string;

  ponenciaPdfUrl: string;
  cesionDerechosPdfUrl: string;

  verificado: boolean;
  agendado: boolean;
  createdAt: string;

  asignaciones?: PonenteAsignacion[];
  evaluaciones?: PonenciaEvaluacion[];
  programaciones?: ProgramacionPonencia[];
};

export type EvaluadorAdmin = {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono: string;
  pais: string;
  ciudad: string;
  universidad: string;
  profesion: string;
  posgrado: string;
  universidadPosgrado: string;
  esDocente: string;
  programaDocencia?: string | null;
  universidadDocencia?: string | null;
  verificado: boolean;
  agendado: boolean;
  createdAt: string;
};

export type AsistenteAdmin = {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono: string;
  pais: string;
  ciudad: string;
  universidad?: string | null;
  programa?: string | null;
  semestre?: string | null;
  createdAt: string;
};

export type AdminRegistrosResponse = {
  filtrosAplicados?: Record<string, unknown>;
  totales?: {
    ponentes: number;
    evaluadores: number;
    asistentes: number;
    asignaciones: number;
    evaluaciones: number;
    salones: number;
    programaciones: number;
  };
  ponentes: PonenteAdmin[];
  evaluadores: EvaluadorAdmin[];
  asistentes: AsistenteAdmin[];
};