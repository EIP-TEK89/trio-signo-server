import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {
  getFilePath(filename: string): string {
    const filePath = join(process.cwd(), 'assets', filename);
    if (!existsSync(filePath)) {
      throw new Error(`File ${filename} does not exist`);
    }
    return filePath;
  }

  getSignRecognizerModelPath(modelName: string): string {
    // Si le nom du modèle ne se termine pas par .zip, ajouter l'extension
    if (!modelName.endsWith('.zip')) {
      modelName = `${modelName}.zip`;
    }

    // Construire le chemin vers le modèle dans le répertoire onnx_models
    const modelPath = join(process.cwd(), 'assets', 'onnx_models', modelName);

    // Vérifier si le fichier existe
    if (!existsSync(modelPath)) {
      throw new Error(`Model ${modelName} does not exist`);
    }

    return modelPath;
  }
}
