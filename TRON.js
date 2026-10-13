const TAMANO_CELDA = 20;
const COLUMNAS = 50;
const FILAS = 30;
const ARENA_X = 0;
const ARENA_Y = 80;
const ANCHO_LIENZO = COLUMNAS * TAMANO_CELDA;
const ALTO_LIENZO = ARENA_Y + FILAS * TAMANO_CELDA + 40;

const ARRIBA = 0;
const DERECHA = 1;
const ABAJO = 2;
const IZQUIERDA = 3;
const CAMBIO_COLUMNA = [0, 1, 0, -1];
const CAMBIO_FILA = [-1, 0, 1, 0];
const ANGULOS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

const VACIO = 0;
const BLOQUE = -1;

const COLOR_FONDO = '#02040f';
const COLOR_ARENA = '#050a1f';
const COLOR_LINEA_ARENA = '#0c1a45';
const COLOR_AZUL_OSCURO = '#0a1030';
const COLOR_AZUL_NEON = '#00e5ff';
const COLOR_AZUL_MEDIO = '#4d7cff';
const COLOR_VERDE_NEON = '#39ff14';

const PASOS_NORMAL = 6;
const PASOS_RAPIDO = 3;
const PASOS_LENTO = 10;

const DURACION_EFECTO = 300;
const DURACION_ESCUDO = 360;

const TIPOS_OBJETO = [
  { nombre: 'VELOCIDAD', letra: 'V', color: '#39ff14' },
  { nombre: 'ESCUDO',    letra: 'E', color: '#00e5ff' },
  { nombre: 'LENTITUD',  letra: 'L', color: '#4d7cff' },
  { nombre: 'PUNTOS',    letra: 'P', color: '#b8fff0' }
];

const MAPA_SPRITE = [
  '.NNNNNNNNN.',
  'NOOBBBBBCCN',
  'NOOBBBBBBCN',
  'NOOBBBBBBCN',
  'NNNNNNNNNNN',
  'NOOBBBBBBCN',
  'NVOBBBBBBVN',
  'NVOBBBBBBVN',
  'NVOBBBBBBVN',
  'NVOBBBBBBVN',
  'NNVVVVVVVNN',
  'NVVVVVWVVVN',
  'NVVVVVVVVVN',
  '.NNVVVVVNN.',
  'NOOBBBBBBCN',
  'NOOBBBBBBCN',
  'NOOBBBBBBCN',
  'NOBBBBBBBCN',
  '.NOBBBBBCN.',
  '.NNNNNNNNN.'
];
const PALETA_AZUL = {
  N: '#000000', O: '#2f3f7f', B: '#4a5c96', C: '#6070a0', V: '#78ffff', W: '#ffffff'
};
const PALETA_VERDE = {
  N: '#000000', O: '#347a28', B: '#64b45a', C: '#7ec47a', V: '#78ffff', W: '#ffffff'
};

let imagenAzul = null;
let imagenVerde = null;

let juego;

let musicaFondo = null;
let musicaLista = false;
let musicaIniciada = false;
let musicaSilenciada = false;
const VOLUMEN_MUSICA = 0.5;

function iniciarMusica() {
  if (musicaIniciada || !musicaLista || musicaFondo === null) return;
  try {
    if (typeof userStartAudio === 'function') {
      userStartAudio();
    } else if (typeof getAudioContext === 'function') {
      const contexto = getAudioContext();
      if (contexto.state !== 'running') contexto.resume();
    }
    musicaFondo.setVolume(musicaSilenciada ? 0 : VOLUMEN_MUSICA);
    musicaFondo.loop();
    musicaIniciada = true;
  } catch (error) {
    console.warn('No se pudo iniciar la música:', error);
  }
}

function alternarMusica() {
  musicaSilenciada = !musicaSilenciada;
  if (musicaFondo !== null && musicaLista) {
    musicaFondo.setVolume(musicaSilenciada ? 0 : VOLUMEN_MUSICA, 0.1);
  }
}

class Boton {
  constructor(texto, x, y, ancho, alto, color) {
    this.texto = texto;
    this.x = x;
    this.y = y;
    this.ancho = ancho;
    this.alto = alto;
    this.color = color;
  }

  contiene(px, py) {
    return px >= this.x && px <= this.x + this.ancho &&
           py >= this.y && py <= this.y + this.alto;
  }

  dibujar(resaltado) {
    push();
    drawingContext.shadowColor = this.color;
    drawingContext.shadowBlur = resaltado ? 25 : 8;
    strokeWeight(3);
    stroke(this.color);
    fill(resaltado ? color(10, 30, 80) : color(COLOR_AZUL_OSCURO));
    rect(this.x, this.y, this.ancho, this.alto, 6);

    noStroke();
    fill(resaltado ? '#ffffff' : this.color);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(24);
    text(this.texto, this.x + this.ancho / 2, this.y + this.alto / 2);
    pop();
  }
}

class Objeto {
  constructor(tipo, columna, fila) {
    this.tipo = tipo;
    this.columna = columna;
    this.fila = fila;
    this.vida = 600;
  }

  actualizar() {
    this.vida--;
  }

  dibujar() {
    const datos = TIPOS_OBJETO[this.tipo];
    if (this.vida < 150 && floor(this.vida / 8) % 2 === 0) return;

    const centroX = ARENA_X + this.columna * TAMANO_CELDA + TAMANO_CELDA / 2;
    const centroY = ARENA_Y + this.fila * TAMANO_CELDA + TAMANO_CELDA / 2;

    push();
    drawingContext.shadowColor = datos.color;
    drawingContext.shadowBlur = 14;
    stroke(datos.color);
    strokeWeight(2);
    fill(COLOR_AZUL_OSCURO);
    circle(centroX, centroY, TAMANO_CELDA * 0.95);

    noStroke();
    fill(datos.color);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(14);
    text(datos.letra, centroX, centroY + 1);
    pop();
  }
}

class Carro {
  constructor(id, nombre, columna, fila, direccion, sprite, colorEstela, esIA) {
    this.id = id;
    this.nombre = nombre;
    this.columna = columna;
    this.fila = fila;
    this.direccion = direccion;
    this.direccionPendiente = direccion;
    this.sprite = sprite;
    this.colorEstela = colorEstela;
    this.esIA = esIA;

    this.vivo = true;
    this.puntos = 0;
    this.contadorPasos = 0;

    this.escudo = 0;
    this.velocidadExtra = 0;
    this.lento = 0;

    this.destinoColumna = columna;
    this.destinoFila = fila;
    this.choqueFrontal = false;
  }

  establecerDireccion(nuevaDireccion) {
    const opuesta = (this.direccion + 2) % 4;
    if (nuevaDireccion !== opuesta) {
      this.direccionPendiente = nuevaDireccion;
    }
  }

  obtenerIntervalo() {
    if (this.velocidadExtra > 0 && this.lento > 0) return PASOS_NORMAL;
    if (this.velocidadExtra > 0) return PASOS_RAPIDO;
    if (this.lento > 0) return PASOS_LENTO;
    return PASOS_NORMAL;
  }

  actualizarEfectos() {
    if (this.escudo > 0) this.escudo--;
    if (this.velocidadExtra > 0) this.velocidadExtra--;
    if (this.lento > 0) this.lento--;
  }

  listoParaMoverse() {
    this.contadorPasos++;
    if (this.contadorPasos >= this.obtenerIntervalo()) {
      this.contadorPasos = 0;
      return true;
    }
    return false;
  }

  prepararPaso() {
    this.direccion = this.direccionPendiente;
    this.destinoColumna = this.columna + CAMBIO_COLUMNA[this.direccion];
    this.destinoFila = this.fila + CAMBIO_FILA[this.direccion];
    this.choqueFrontal = false;
  }

  decidirDireccion(juego) {
    const hayPeligroAdelante = this.hayPeligro(juego, this.direccion, 3);
    const giroAlAzar = random() < 0.03;

    if (hayPeligroAdelante || giroAlAzar) {
      let opciones = [(this.direccion + 1) % 4, (this.direccion + 3) % 4];
      if (random() < 0.5) opciones.reverse();

      for (const opcion of opciones) {
        if (!this.hayPeligro(juego, opcion, 3)) {
          this.establecerDireccion(opcion);
          return;
        }
      }
      if (hayPeligroAdelante) {
        for (const opcion of opciones) {
          if (!this.hayPeligro(juego, opcion, 1)) {
            this.establecerDireccion(opcion);
            return;
          }
        }
      }
    }
  }

  hayPeligro(juego, direccion, distancia) {
    for (let i = 1; i <= distancia; i++) {
      const c = this.columna + CAMBIO_COLUMNA[direccion] * i;
      const f = this.fila + CAMBIO_FILA[direccion] * i;
      if (!juego.celdaLibre(c, f)) return true;
    }
    return false;
  }

  morir() {
    this.vivo = false;
  }

  dibujar() {
    if (!this.vivo) return;

    const centroX = ARENA_X + this.columna * TAMANO_CELDA + TAMANO_CELDA / 2;
    const centroY = ARENA_Y + this.fila * TAMANO_CELDA + TAMANO_CELDA / 2;

    push();
    translate(centroX, centroY);
    rotate(ANGULOS[this.direccion]);
    imageMode(CENTER);
    image(this.sprite, 0, 0, 20, 36);
    pop();

    if (this.escudo > 0) {
      if (this.escudo > 90 || floor(this.escudo / 6) % 2 === 0) {
        push();
        noFill();
        stroke(0, 229, 255, 200);
        strokeWeight(3);
        drawingContext.shadowColor = COLOR_AZUL_NEON;
        drawingContext.shadowBlur = 15;
        circle(centroX, centroY, 44);
        pop();
      }
    }
  }
}

class Juego {
  constructor(spriteAzul, spriteVerde) {
    this.spriteAzul = spriteAzul;
    this.spriteVerde = spriteVerde;

    this.estado = 'menu';
    this.modo = 1;
    this.opcionMenu = 0;
    this.opcionFin = 0;

    this.botonesMenu = [
      new Boton('1 JUGADOR', (ANCHO_LIENZO - 420) / 2, 350, 420, 70, COLOR_AZUL_NEON),
      new Boton('2 JUGADORES', (ANCHO_LIENZO - 420) / 2, 445, 420, 70, COLOR_VERDE_NEON)
    ];
    this.botonesFin = [
      new Boton('VOLVER A JUGAR', ANCHO_LIENZO / 2 - 280, 450, 260, 60, COLOR_VERDE_NEON),
      new Boton('MENÚ', ANCHO_LIENZO / 2 + 20, 450, 260, 60, COLOR_AZUL_NEON)
    ];

    this.cuadricula = [];
    this.carros = [];
    this.objetos = [];
    this.avisos = [];
    this.cantidadBloques = 0;
    this.fotogramas = 0;

    this.tituloFin = '';
    this.subtituloFin = '';
    this.colorFin = COLOR_VERDE_NEON;
  }

  iniciarPartida(modo) {
    this.modo = modo;
    this.fotogramas = 0;
    this.objetos = [];
    this.avisos = [];
    this.cantidadBloques = 0;

    this.cuadricula = [];
    for (let c = 0; c < COLUMNAS; c++) {
      this.cuadricula.push(new Array(FILAS).fill(VACIO));
    }

    this.carros = [];
    const filaCentro = floor(FILAS / 2);
    const columnaDerecha = COLUMNAS - 6;
    this.carros.push(new Carro(1, 'JUGADOR 1', 5, filaCentro, DERECHA,
                               this.spriteAzul, '#00d9ff', false));
    if (modo === 1) {
      this.carros.push(new Carro(2, 'ENEMIGO 1', columnaDerecha, 8, IZQUIERDA,
                                 this.spriteVerde, '#39ff14', true));
      this.carros.push(new Carro(3, 'ENEMIGO 2', columnaDerecha, 22, IZQUIERDA,
                                 this.spriteVerde, '#9dff00', true));
    } else {
      this.carros.push(new Carro(2, 'JUGADOR 2', columnaDerecha, filaCentro, IZQUIERDA,
                                 this.spriteVerde, '#39ff14', false));
    }

    for (const carro of this.carros) {
      this.cuadricula[carro.columna][carro.fila] = carro.id;
    }

    for (let i = 0; i < 35; i++) this.crearBloque();

    this.estado = 'jugando';
  }

  dentroDeArena(columna, fila) {
    return columna >= 0 && columna < COLUMNAS && fila >= 0 && fila < FILAS;
  }

  celdaLibre(columna, fila) {
    return this.dentroDeArena(columna, fila) && this.cuadricula[columna][fila] === VACIO;
  }

  buscarCeldaLibre(distanciaMinima) {
    for (let intento = 0; intento < 100; intento++) {
      const c = floor(random(COLUMNAS));
      const f = floor(random(FILAS));
      if (this.cuadricula[c][f] !== VACIO) continue;

      let lejos = true;
      for (const carro of this.carros) {
        if (abs(c - carro.columna) + abs(f - carro.fila) < distanciaMinima) lejos = false;
      }
      for (const objeto of this.objetos) {
        if (objeto.columna === c && objeto.fila === f) lejos = false;
      }
      if (lejos) return { columna: c, fila: f };
    }
    return null;
  }

  crearBloque() {
    const lugar = this.buscarCeldaLibre(6);
    if (lugar) {
      this.cuadricula[lugar.columna][lugar.fila] = BLOQUE;
      this.cantidadBloques++;
    }
  }

  crearObjeto() {
    const lugar = this.buscarCeldaLibre(4);
    if (lugar) {
      const tipo = floor(random(TIPOS_OBJETO.length));
      this.objetos.push(new Objeto(tipo, lugar.columna, lugar.fila));
    }
  }

  aplicarObjeto(carro, objeto) {
    const datos = TIPOS_OBJETO[objeto.tipo];
    carro.puntos += 10;

    if (datos.nombre === 'VELOCIDAD') {
      carro.velocidadExtra = DURACION_EFECTO;
    } else if (datos.nombre === 'ESCUDO') {
      carro.escudo = DURACION_ESCUDO;
    } else if (datos.nombre === 'LENTITUD') {
      for (const otro of this.carros) {
        if (otro !== carro && otro.vivo) otro.lento = DURACION_EFECTO;
      }
    } else if (datos.nombre === 'PUNTOS') {
      carro.puntos += 50;
    }

    this.agregarAviso(datos.nombre, carro, datos.color);
  }

  agregarAviso(texto, carro, color) {
    this.avisos.push({
      texto: texto,
      x: ARENA_X + carro.columna * TAMANO_CELDA,
      y: ARENA_Y + carro.fila * TAMANO_CELDA - 10,
      vida: 60,
      color: color
    });
  }

  actualizar() {
    if (this.estado !== 'jugando') return;

    this.fotogramas++;

    if (this.fotogramas % 240 === 0 && this.objetos.length < 4) this.crearObjeto();
    if (this.fotogramas % 420 === 0 && this.cantidadBloques < 60) this.crearBloque();

    for (const objeto of this.objetos) objeto.actualizar();
    this.objetos = this.objetos.filter(o => o.vida > 0);

    for (const aviso of this.avisos) {
      aviso.vida--;
      aviso.y -= 0.6;
    }
    this.avisos = this.avisos.filter(a => a.vida > 0);

    const quienesSeMueven = [];
    for (const carro of this.carros) {
      if (!carro.vivo) continue;
      carro.actualizarEfectos();
      if (carro.listoParaMoverse()) {
        if (carro.esIA) carro.decidirDireccion(this);
        carro.prepararPaso();
        quienesSeMueven.push(carro);
      }
    }

    for (let i = 0; i < quienesSeMueven.length; i++) {
      for (let j = i + 1; j < quienesSeMueven.length; j++) {
        const a = quienesSeMueven[i];
        const b = quienesSeMueven[j];
        if (a.destinoColumna === b.destinoColumna && a.destinoFila === b.destinoFila) {
          a.choqueFrontal = true;
          b.choqueFrontal = true;
        }
      }
    }

    for (const carro of quienesSeMueven) {
      this.moverCarro(carro);
    }

    this.revisarFinDePartida();
  }

  moverCarro(carro) {
    const c = carro.destinoColumna;
    const f = carro.destinoFila;

    if (!this.dentroDeArena(c, f)) {
      this.destruirCarro(carro);
      return;
    }

    if (carro.choqueFrontal && carro.escudo === 0) {
      this.destruirCarro(carro);
      return;
    }

    const contenido = this.cuadricula[c][f];

    if (contenido === BLOQUE) {
      if (carro.escudo > 0) {
        this.cuadricula[c][f] = VACIO;
        this.cantidadBloques--;
        carro.puntos += 5;
      } else {
        this.destruirCarro(carro);
        return;
      }
    } else if (contenido !== VACIO) {
      if (carro.escudo === 0) {
        this.destruirCarro(carro);
        return;
      }
    }

    carro.columna = c;
    carro.fila = f;
    if (this.cuadricula[c][f] === VACIO) {
      this.cuadricula[c][f] = carro.id;
    }
    carro.puntos += 1;

    for (const objeto of this.objetos) {
      if (objeto.columna === c && objeto.fila === f) {
        this.aplicarObjeto(carro, objeto);
        objeto.vida = 0;
      }
    }
  }

  destruirCarro(carro) {
    carro.morir();
    for (let c = 0; c < COLUMNAS; c++) {
      for (let f = 0; f < FILAS; f++) {
        if (this.cuadricula[c][f] === carro.id) this.cuadricula[c][f] = VACIO;
      }
    }
  }

  revisarFinDePartida() {
    const vivos = this.carros.filter(c => c.vivo);

    if (this.modo === 1) {
      const jugador = this.carros[0];
      if (!jugador.vivo) {
        this.terminarPartida('DERROTA', 'Te estrellaste. ¡Inténtalo otra vez!', '#ff4d6d');
      } else if (vivos.length === 1) {
        jugador.puntos += 200;
        this.terminarPartida('¡VICTORIA!', 'Destruiste a todos los enemigos', COLOR_VERDE_NEON);
      }
    } else {
      if (vivos.length === 1) {
        vivos[0].puntos += 200;
        const color = vivos[0].id === 1 ? COLOR_AZUL_NEON : COLOR_VERDE_NEON;
        this.terminarPartida('¡VICTORIA!', 'Gana el ' + vivos[0].nombre, color);
      } else if (vivos.length === 0) {
        this.terminarPartida('EMPATE', 'Los dos se estrellaron', COLOR_AZUL_MEDIO);
      }
    }
  }

  terminarPartida(titulo, subtitulo, colorTexto) {
    this.estado = 'fin';
    this.opcionFin = 0;
    this.tituloFin = titulo;
    this.subtituloFin = subtitulo;
    this.colorFin = colorTexto;
  }

  dibujar() {
    background(COLOR_FONDO);

    if (this.estado === 'menu') {
      this.dibujarMenu();
    } else {
      this.dibujarPartida();
      if (this.estado === 'fin') this.dibujarPantallaFinal();
    }
  }

  dibujarMarcoArcade() {
    push();
    noFill();
    drawingContext.shadowColor = COLOR_VERDE_NEON;
    drawingContext.shadowBlur = 20;
    stroke(COLOR_VERDE_NEON);
    strokeWeight(6);
    rect(10, 10, ANCHO_LIENZO - 20, ALTO_LIENZO - 20, 14);

    drawingContext.shadowColor = COLOR_AZUL_NEON;
    stroke(COLOR_AZUL_NEON);
    strokeWeight(3);
    rect(26, 26, ANCHO_LIENZO - 52, ALTO_LIENZO - 52, 8);
    pop();
  }

  dibujarMenu() {
    noStroke();
    fill(COLOR_AZUL_OSCURO);
    rect(26, 26, ANCHO_LIENZO - 52, ALTO_LIENZO - 52, 8);
    this.dibujarMarcoArcade();

    push();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    drawingContext.shadowColor = COLOR_AZUL_NEON;
    drawingContext.shadowBlur = 40;
    fill(COLOR_AZUL_NEON);
    noStroke();
    textSize(150);
    text('TRON', ANCHO_LIENZO / 2, 180);

    drawingContext.shadowColor = COLOR_VERDE_NEON;
    drawingContext.shadowBlur = 15;
    fill(COLOR_VERDE_NEON);
    textSize(26);
    text('A  R  C  A  D  E', ANCHO_LIENZO / 2, 275);
    pop();

    for (let i = 0; i < this.botonesMenu.length; i++) {
      this.botonesMenu[i].dibujar(i === this.opcionMenu);
    }

    push();
    textAlign(CENTER, CENTER);
    noStroke();
    fill(COLOR_AZUL_MEDIO);
    textSize(16);
    text('↑ ↓ para elegir  ·  ENTER o clic para jugar', ANCHO_LIENZO / 2, 565);
    fill('#7fe9ff');
    text('1 Jugador: flechas o WASD', ANCHO_LIENZO / 2, 600);
    text('2 Jugadores: J1 = WASD  ·  J2 = flechas', ANCHO_LIENZO / 2, 625);
    fill(COLOR_VERDE_NEON);
    text('M = música', ANCHO_LIENZO / 2, 655);
    pop();
  }

  dibujarPartida() {
    this.dibujarArena();

    for (const objeto of this.objetos) objeto.dibujar();
    for (const carro of this.carros) carro.dibujar();
    this.dibujarAvisos();

    this.dibujarMarcador();
    this.dibujarLeyenda();
  }

  dibujarArena() {
    noStroke();
    fill(COLOR_ARENA);
    rect(ARENA_X, ARENA_Y, COLUMNAS * TAMANO_CELDA, FILAS * TAMANO_CELDA);

    stroke(COLOR_LINEA_ARENA);
    strokeWeight(1);
    for (let c = 0; c <= COLUMNAS; c++) {
      line(ARENA_X + c * TAMANO_CELDA, ARENA_Y, ARENA_X + c * TAMANO_CELDA, ARENA_Y + FILAS * TAMANO_CELDA);
    }
    for (let f = 0; f <= FILAS; f++) {
      line(ARENA_X, ARENA_Y + f * TAMANO_CELDA, ARENA_X + COLUMNAS * TAMANO_CELDA, ARENA_Y + f * TAMANO_CELDA);
    }

    for (let c = 0; c < COLUMNAS; c++) {
      for (let f = 0; f < FILAS; f++) {
        const contenido = this.cuadricula[c][f];
        if (contenido === VACIO) continue;

        const x = ARENA_X + c * TAMANO_CELDA;
        const y = ARENA_Y + f * TAMANO_CELDA;

        if (contenido === BLOQUE) {
          fill('#16256b');
          stroke(COLOR_AZUL_MEDIO);
          strokeWeight(2);
          rect(x + 1, y + 1, TAMANO_CELDA - 2, TAMANO_CELDA - 2, 2);
          line(x + 5, y + 5, x + TAMANO_CELDA - 5, y + TAMANO_CELDA - 5);
          line(x + TAMANO_CELDA - 5, y + 5, x + 5, y + TAMANO_CELDA - 5);
        } else {
          const dueno = this.carros.find(carro => carro.id === contenido);
          fill(dueno.colorEstela);
          noStroke();
          rect(x + 3, y + 3, TAMANO_CELDA - 6, TAMANO_CELDA - 6, 2);
        }
      }
    }

    noFill();
    stroke(COLOR_AZUL_NEON);
    strokeWeight(3);
    rect(ARENA_X + 1, ARENA_Y + 1, COLUMNAS * TAMANO_CELDA - 2, FILAS * TAMANO_CELDA - 2);
  }

  dibujarAvisos() {
    push();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(14);
    noStroke();
    for (const aviso of this.avisos) {
      const c = color(aviso.color);
      c.setAlpha(map(aviso.vida, 0, 60, 0, 255));
      fill(c);
      text(aviso.texto, aviso.x, aviso.y);
    }
    pop();
  }

  textoEfectos(carro) {
    const partes = [];
    if (carro.escudo > 0) partes.push('ESCUDO ' + ceil(carro.escudo / 60) + 's');
    if (carro.velocidadExtra > 0) partes.push('VELOZ ' + ceil(carro.velocidadExtra / 60) + 's');
    if (carro.lento > 0) partes.push('LENTO ' + ceil(carro.lento / 60) + 's');
    return partes.join('  ');
  }

  dibujarMarcador() {
    push();
    noStroke();
    textStyle(BOLD);

    const jugador1 = this.carros[0];
    textAlign(LEFT, CENTER);
    fill(COLOR_AZUL_NEON);
    textSize(22);
    text('JUGADOR 1:  ' + jugador1.puntos, 20, 28);
    textSize(13);
    fill('#7fe9ff');
    text(this.textoEfectos(jugador1), 20, 58);

    textAlign(RIGHT, CENTER);
    if (this.modo === 2) {
      const jugador2 = this.carros[1];
      fill(COLOR_VERDE_NEON);
      textSize(22);
      text('JUGADOR 2:  ' + jugador2.puntos, ANCHO_LIENZO - 20, 28);
      textSize(13);
      text(this.textoEfectos(jugador2), ANCHO_LIENZO - 20, 58);
    } else {
      const enemigosVivos = this.carros.filter(c => c.esIA && c.vivo).length;
      fill(COLOR_VERDE_NEON);
      textSize(22);
      text('ENEMIGOS:  ' + enemigosVivos, ANCHO_LIENZO - 20, 28);
    }

    textAlign(CENTER, CENTER);
    drawingContext.shadowColor = COLOR_AZUL_NEON;
    drawingContext.shadowBlur = 15;
    fill(COLOR_AZUL_NEON);
    textSize(34);
    text('TRON', ANCHO_LIENZO / 2, 40);
    pop();
  }

  dibujarLeyenda() {
    push();
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    textSize(14);
    noStroke();
    const descripciones = ['V = Velocidad', 'E = Escudo', 'L = Lentitud rivales', 'P = +50 puntos'];
    const colores = TIPOS_OBJETO.map(t => t.color);
    const y = ARENA_Y + FILAS * TAMANO_CELDA + 20;
    const posicionesX = [20, 260, 480, 760];
    for (let i = 0; i < descripciones.length; i++) {
      fill(colores[i]);
      text(descripciones[i], posicionesX[i], y);
    }
    pop();
  }

  dibujarPantallaFinal() {
    noStroke();
    fill(2, 4, 15, 205);
    rect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);

    push();
    drawingContext.shadowColor = this.colorFin;
    drawingContext.shadowBlur = 25;
    stroke(this.colorFin);
    strokeWeight(4);
    fill(COLOR_AZUL_OSCURO);
    rect((ANCHO_LIENZO - 620) / 2, 190, 620, 360, 12);

    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    fill(this.colorFin);
    textSize(64);
    text(this.tituloFin, ANCHO_LIENZO / 2, 262);

    drawingContext.shadowBlur = 0;
    fill('#cfeaff');
    textSize(22);
    text(this.subtituloFin, ANCHO_LIENZO / 2, 325);

    textSize(24);
    fill(COLOR_AZUL_NEON);
    let lineaPuntos = 'JUGADOR 1: ' + this.carros[0].puntos + ' pts';
    if (this.modo === 2) {
      lineaPuntos += '     JUGADOR 2: ' + this.carros[1].puntos + ' pts';
    }
    text(lineaPuntos, ANCHO_LIENZO / 2, 385);
    pop();

    for (let i = 0; i < this.botonesFin.length; i++) {
      this.botonesFin[i].dibujar(i === this.opcionFin);
    }
  }

  teclaPresionada(tecla, codigo) {
    iniciarMusica();
    const letra = tecla.toLowerCase();

    if (letra === 'm') {
      alternarMusica();
      return;
    }

    if (this.estado === 'menu') {
      if (codigo === UP_ARROW || codigo === DOWN_ARROW) {
        this.opcionMenu = (this.opcionMenu + 1) % 2;
      } else if (codigo === ENTER) {
        this.iniciarPartida(this.opcionMenu + 1);
      } else if (tecla === '1') {
        this.iniciarPartida(1);
      } else if (tecla === '2') {
        this.iniciarPartida(2);
      }
    } else if (this.estado === 'fin') {
      if (codigo === LEFT_ARROW || codigo === RIGHT_ARROW) {
        this.opcionFin = (this.opcionFin + 1) % 2;
      } else if (codigo === ENTER) {
        this.elegirOpcionFin(this.opcionFin);
      }
    } else if (this.estado === 'jugando') {
      this.controlarCarros(letra, codigo);
    }
  }

  controlarCarros(letra, codigo) {
    let direccionWasd = -1;
    if (letra === 'w') direccionWasd = ARRIBA;
    if (letra === 'd') direccionWasd = DERECHA;
    if (letra === 's') direccionWasd = ABAJO;
    if (letra === 'a') direccionWasd = IZQUIERDA;

    let direccionFlechas = -1;
    if (codigo === UP_ARROW) direccionFlechas = ARRIBA;
    if (codigo === RIGHT_ARROW) direccionFlechas = DERECHA;
    if (codigo === DOWN_ARROW) direccionFlechas = ABAJO;
    if (codigo === LEFT_ARROW) direccionFlechas = IZQUIERDA;

    const jugador1 = this.carros[0];

    if (this.modo === 1) {
      if (direccionWasd >= 0 && jugador1.vivo) jugador1.establecerDireccion(direccionWasd);
      if (direccionFlechas >= 0 && jugador1.vivo) jugador1.establecerDireccion(direccionFlechas);
    } else {
      const jugador2 = this.carros[1];
      if (direccionWasd >= 0 && jugador1.vivo) jugador1.establecerDireccion(direccionWasd);
      if (direccionFlechas >= 0 && jugador2.vivo) jugador2.establecerDireccion(direccionFlechas);
    }
  }

  clicRaton(x, y) {
    iniciarMusica();

    if (this.estado === 'menu') {
      for (let i = 0; i < this.botonesMenu.length; i++) {
        if (this.botonesMenu[i].contiene(x, y)) this.iniciarPartida(i + 1);
      }
    } else if (this.estado === 'fin') {
      for (let i = 0; i < this.botonesFin.length; i++) {
        if (this.botonesFin[i].contiene(x, y)) this.elegirOpcionFin(i);
      }
    }
  }

  moverRaton(x, y) {
    if (this.estado === 'menu') {
      for (let i = 0; i < this.botonesMenu.length; i++) {
        if (this.botonesMenu[i].contiene(x, y)) this.opcionMenu = i;
      }
    } else if (this.estado === 'fin') {
      for (let i = 0; i < this.botonesFin.length; i++) {
        if (this.botonesFin[i].contiene(x, y)) this.opcionFin = i;
      }
    }
  }

  elegirOpcionFin(opcion) {
    if (opcion === 0) {
      this.iniciarPartida(this.modo);
    } else {
      this.estado = 'menu';
    }
  }
}

function crearSpriteDesdeMapa(paleta) {
  const alto = MAPA_SPRITE.length;
  const ancho = MAPA_SPRITE[0].length;
  const grafico = createGraphics(ancho, alto);
  grafico.pixelDensity(1);
  grafico.noStroke();

  for (let fila = 0; fila < alto; fila++) {
    for (let columna = 0; columna < ancho; columna++) {
      const letra = MAPA_SPRITE[fila][columna];
      if (letra === '.') continue;
      grafico.fill(paleta[letra]);
      grafico.rect(columna, fila, 1, 1);
    }
  }
  return grafico;
}

function preload() {
  imagenAzul = loadImage('carro_azul.png', () => {}, () => { imagenAzul = null; });
  imagenVerde = loadImage('carro_verde.png', () => {}, () => { imagenVerde = null; });
  if (typeof loadSound === 'function') {
    musicaFondo = loadSound(
      'fondo.mp3',
      () => { musicaLista = true; },
      () => {
        musicaFondo = null;
        console.warn('No se encontró fondo.mp3: el juego funcionará sin música.');
      }
    );
  } else {
    console.warn('p5.sound no está cargado: el juego funcionará sin música.');
  }
}

function setup() {
  createCanvas(ANCHO_LIENZO, ALTO_LIENZO);
  frameRate(60);
  noSmooth();
  textFont('Courier New');

  const spriteAzul = imagenAzul || crearSpriteDesdeMapa(PALETA_AZUL);
  const spriteVerde = imagenVerde || crearSpriteDesdeMapa(PALETA_VERDE);

  juego = new Juego(spriteAzul, spriteVerde);
}

function draw() {
  juego.actualizar();
  juego.dibujar();
}

function keyPressed() {
  juego.teclaPresionada(key, keyCode);
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, ENTER].includes(keyCode)) {
    return false;
  }
}

function mousePressed() {
  juego.clicRaton(mouseX, mouseY);
}

function mouseMoved() {
  juego.moverRaton(mouseX, mouseY);
}
