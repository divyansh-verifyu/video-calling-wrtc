export interface Meeting {
  readonly id: string;
  readonly region: string | null;
  readonly createdAt: Date;
  readonly raw?: Readonly<Record<string, unknown>>;
}
