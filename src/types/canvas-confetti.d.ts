declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  type CreateTypes = (options?: Options) => Promise<null> | null;

  interface ConfettiCannon {
    (options?: Options): Promise<null> | null;
    reset: () => void;
  }

  function create(canvas: HTMLCanvasElement, options?: GlobalOptions): ConfettiCannon;

  const confetti: {
    (options?: Options): Promise<null> | null;
    reset: () => void;
    create: typeof create;
  };

  export default confetti;
}
