// types/index.ts
export interface ImagenRuta {
    id: string;
    url: string;
  }
  
  export interface Ruta {
    id: string;
    nombre: string;
    imagenes: ImagenRuta[];
  }
  
  export interface Repartidor {
    id: string;
    nombre: string;
    rutas: Ruta[];
  }
  