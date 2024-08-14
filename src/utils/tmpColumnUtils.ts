const OWNER_JOIN_COLUMN_ALIAS_PREFIX = 'objectiontmpjoin';

export function getTempColumn(index: number) {
  return `${OWNER_JOIN_COLUMN_ALIAS_PREFIX}${index}`;
}

export function isTempColumn(col: string) {
  return col.startsWith(OWNER_JOIN_COLUMN_ALIAS_PREFIX);
}
