let _version = 0;

export function bumpProjectVersion() {
  _version += 1;
}

export function getProjectVersion() {
  return _version;
}
