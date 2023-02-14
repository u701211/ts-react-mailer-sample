import lodash from "lodash";

const isNumberRegex = /^([1-9]\d*|0)$/;


export type Path = {
  $toArray: () => PropertyKey[];
  $toString: () => string;
  $contains: (path: Path) => boolean;
  $equals: (path: Path) => boolean;
  $getChild: (key: PropertyKey) => Path;
  $getCurrentKey(): PropertyKey;
  // $asTypedPath: <T>() => TypedPath<T>;
};

type TypedPathDummy<T> = {
  $dummy?: T
};
export type TypedPath<T> = (
  T extends (infer Z)[]
  ? {
      [index: number]: TypedPath<Z>;
      length: TypedPath<number>;
  }:
  {
    // readonly [K in keyof T]-?: TypedPath<T[K] extends infer A ? A : never>;
    readonly [K in keyof T]-?: TypedPath<T[K]>;
  }
)
& Path & TypedPathDummy<T>

class PathImpl implements Path {
  currentPath: PropertyKey[];

  constructor(currentPath: PropertyKey[]) {
    this.currentPath = currentPath;
  }

  $toArray() {
    return this.currentPath;
  }

  $toString() {
    const pathString = this.currentPath.reduce<string>((current, next) => {
      if (lodash.isNumber(next)) {
        return `${current}[${next.toString()}]`;
      }

      return `${current}.${next.toString()}`;
    }, '');
    return pathString[0] === '.' ? pathString.substring(1) : pathString;
  }

  $contains(path: Path) {
    const targetPath = path.$toArray();
    if (this.currentPath.length > targetPath.length) {
      return false;
    }

    for (let i = 0; i < this.currentPath.length; i++) {
      if (this.currentPath[i] !== targetPath[i]) {
        return false;
      }
    }
    return true;
  }

  $equals(path: Path): boolean {
    return this.$toString() === path.$toString();
  }

  $getChild(key: PropertyKey) {
    const propertyName = (lodash.isString(key) && isNumberRegex.test(key)) ? Number(key) : key;
    return new PathImpl([...this.currentPath, propertyName]);
  }

  $getCurrentKey() {
    return this.currentPath[this.currentPath.length - 1];
  }

  // $asTypedPath<T_TARGET>() {
  //   return $pathFrom<T_TARGET>(this.$toArray());
  // }
}
function _path<T extends object>(currentPath: PropertyKey[]): TypedPath<T> {
  return new Proxy(new PathImpl(currentPath) as any, {
    get: (target: T, name: PropertyKey, receiver: any): any => {
      if (name in target) {
        return Reflect.get(target as any, name, receiver);
      }

      const propertyName = (lodash.isString(name) && isNumberRegex.test(name)) ? Number(name) : name;
      return _path([...currentPath, propertyName]);
    },
  }) as TypedPath<T>;
}

export function $path<T extends object>() {
  return _path<T>([]);
}
export function $pathFrom<T extends object>(path: string | PropertyKey[]) {
  const pathArray = lodash.isArray(path) ? path : path.split(/[\.\[\]]/).filter((item) => item.trim().length > 0).map((name) => ((lodash.isString(name) && isNumberRegex.test(name)) ? Number(name) : name));
  return _path<T>(pathArray);
}