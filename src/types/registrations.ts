export type TipoDocumento = "CC" | "TI" | "CE" | "PAS";
export type LineaTematica = "1" | "2" | "3" | "4" | "5" | "6";

export type AsistenteRegistration = {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  telefono: string;

  pais: string;
  ciudad: string;

  institucion: string;
  universidad: string;

  programa: string;
  semestre: string;
};

export type EvaluadorRegistration = {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  telefono: string;

  pais: string;
  ciudad: string;

  institucion: string;
  universidad: string;

  programa: string;
  semestre: string;

  profesion: string;
  posgrado: string;
  universidadPosgrado: string;
  esDocente: "si" | "no";
  programaDocencia?: string;
};

export type PonenteRegistration = {
  // Ponente 1
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  telefono: string;

  // Ponente 2 (opcional)
  nombres2?: string;
  apellidos2?: string;
  tipoDocumento2?: TipoDocumento;
  documento2?: string;
  email2?: string;
  telefono2?: string;

  pais: string;
  ciudad: string;

  institucion: string;
  universidad: string;

  programa: string;
  semestre: string;

  grupoInvestigacion?: string;
  semillero?: string;

  tituloPonencia: string;
  resumen: string;
  lineaTematica: LineaTematica;
};
