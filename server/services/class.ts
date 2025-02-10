import {v4 as uuidv4} from 'uuid';

import { Class } from '../models/class.ts';

class ClassService {
    private classes: Class[] = [];
    
    async getClass(id: string): Promise<Class> {
        const existingClass = this.classes.find((tempClass) => tempClass.id === id);

        if (existingClass) {
            return existingClass;
        }
        throw new Error(`Class with id '${id}' not found`);
    }

    async createClass(name: string): Promise<Class> {
        if (!name) {
            throw new Error('Name cannot be empty');
        }
        const newClass: Class = {
            id: uuidv4(),
            name
        };
        this.classes.push(newClass);
        return newClass;
    }

    async updateClass(id: string, name: string): Promise<Class> {
        const existingClass = this.classes.find((tempClass) => tempClass.id === id);
        if (existingClass) {
            existingClass.name = name;
            return existingClass;
        }
        throw new Error(`Class with id '${id}' not found`);
    }

    async deleteClass(id: string) {
        const existingClass = this.classes.find((tempClass) => tempClass.id === id);
        if (existingClass) {
            const index = this.classes.indexOf(existingClass);
            this.classes.splice(index, 1);
        }
        throw new Error(`Class with id '${id}' not found`);
    }
}

export default new ClassService();