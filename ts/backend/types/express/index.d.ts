declare namespace Express {
  export interface Request {
    validated?: {
      body?: any,
      query?: any,
      params?: any,
    },
    user?: {
      id: number
    }
  }
}
