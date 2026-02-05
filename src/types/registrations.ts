export type LineaTematica = "1" | "2" | "3";
export type TipoDocumento = "CC" | "TI" | "CE" | "PAS";
export type SiNo = "si" | "no";

export interface BasePerson {
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
}

/** Payloads (solo datos “JSON friendly”) */
export type AsistenteRegistration = BasePerson;

export interface PonenteRegistration extends BasePerson {
  tituloPonencia: string;
  resumen: string;
  lineaTematica: LineaTematica;
}

export interface EvaluadorRegistration extends BasePerson {
  profesion: string;
  posgrado: string;
  universidadPosgrado: string;
  esDocente: SiNo;
  programaDocencia?: string;
}
