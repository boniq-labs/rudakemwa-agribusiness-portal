import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getAnimalCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimalCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAnimalCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAnimalCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBreeds: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBreed: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBreed: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBreed: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimals: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimal: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAnimal: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAnimal: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalLocations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalGroups: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=animalController.d.ts.map