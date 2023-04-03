const typeDefs = `
    type User {
      username: String!
      favoriteGenre: String!
      id: ID!
    }

    type Token {
      value: String!
    }
    type Book{
        title: String!
        published: Int!
        author: Author!
        id:ID!
        genres:[String!]!
    }
    type Author{
        name:String!
        born:Int
        bookCount:Int!
        id:ID!
    }
    type Query {
        allBooks(author :String , genre :String): [Book!]!
        allAuthors: [Author!]!
        bookCount:Int!
        authorCount:Int!
        me: User
        allGenres: [String!]!
        recommendedBooks: [Book!]!
    }
    type Mutation {
        addBook(
            title: String!
            published: Int!
            author:String!
            genres:[String!]!
        ): Book
        editAuthor(
            name: String!
            setBornTo: Int!
        ) : Author 
        createUser(
          username: String!
          favoriteGenre: String!
        ): User
        login(
          username: String!
          password: String!
        ): Token
      }
    type Subscription {
      bookAdded: Book!
    }    
      
`;
module.exports = typeDefs;
