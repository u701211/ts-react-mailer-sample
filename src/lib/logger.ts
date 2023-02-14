
export const logger = {
  debug: process.env.NODE_ENV === "development" ? console.log.bind(console, "%c[debug]", "color:blue;font-weight:bold;") : (...items: any[]) => {},
  

}