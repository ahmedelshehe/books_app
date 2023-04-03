const { GraphQLError } = require("graphql");
const Author = require("./models/author");
const User = require("./models/user");
const Book = require("./models/book");
const jwt = require("jsonwebtoken");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const resolvers = {
  Query: {
    allBooks: async (root, args) => {
      if (args.genre) {
        let books = await Book.find({}).populate("author", {
          name: 1,
          born: 1,
        });
        books = books.filter((book) => book.genres.includes(args.genre));
        console.log(books);
        return books;
      }
      const books = await Book.find({}).populate("author", {
        name: 1,
        born: 1,
      });
      return books;
    },
    allAuthors: async (root, args) => {
      return Author.find({});
    },
    allGenres: async (root, args) => {
      let books = await Book.find({});
      let genres = [];
      books.map((book) => genres.push(...book.genres));
      genres = [...new Set(genres)];
      return genres;
    },
    bookCount: async () => {
      const books = await Book.find({});
      return books.length;
    },
    authorCount: async () => {
      const authors = await Author.find({});
      return authors.length;
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
    recommendedBooks: async (root, args, context) => {
      let books = await Book.find({}).populate("author", {
        name: 1,
        born: 1,
      });
      books = books.filter((book) =>
        book.genres.includes(context.currentUser.favoriteGenre)
      );
      console.log(books);
      return books;
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      let author = await Author.findOne({ name: args.author });
      if (!author) {
        author = new Author({ name: args.author });
        await author.save();
      }
      try {
        const newBook = new Book({ ...args, author: author._id });
        await newBook.save();
        author.books.push(newBook._id);
        await author.save();
        const savedBook = newBook.populate("author", {
          name: 1,
          born: 1,
        });
        pubsub.publish("BOOK_ADDED", {
          bookAdded: savedBook,
        });
        return savedBook;
      } catch (error) {
        throw new GraphQLError("Saving book failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      let author = await Author.findOneAndUpdate(
        { name: args.name },
        { born: args.setBornTo }
      );
      return author;
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};
module.exports = resolvers;
