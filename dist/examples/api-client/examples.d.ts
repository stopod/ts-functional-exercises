type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
};
type CreateUserRequest = {
    name: string;
    email: string;
    password: string;
};
type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
export declare class UserService {
    static getUsers(): Promise<User[]>;
    static getUser(id: number): Promise<User | null>;
    static createUser(userData: CreateUserRequest): Promise<User>;
    static updateUser(id: number, userData: UpdateUserRequest): Promise<User>;
    static deleteUser(id: number): Promise<void>;
}
export declare function runApiClientExamples(): Promise<void>;
export {};
