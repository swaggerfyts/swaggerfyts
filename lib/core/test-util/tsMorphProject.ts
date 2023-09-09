import { Project } from 'ts-morph';

export const tsMorphProject = new Project({
  skipAddingFilesFromTsConfig: true,
  tsConfigFilePath: __dirname + '/../../../tsconfig.json',
  compilerOptions: {
    noEmit: true,
  },
});
