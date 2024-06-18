// Importing the knex instance from the db connection module
const { knex } = require("../db/connection");

// The async function 'migrate' will handle the database migrations
const migrate = async () => {
  // Check if the "users" table already exists
  const usersTableExists = await knex.schema.hasTable("users");
  // If it doesn't exist, create the "users" table
  if (!usersTableExists) {
    await knex.schema
      .createTable("users", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.string("email").notNullable().unique(); // Non-nullable email field
        table.string("mobile");

        table.string("first_name").notNullable(); // Non-nullable password field
        table.string("last_name").notNullable(); // Non-nullable password field

        table.string("photo");
        table.boolean("is_active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "girls" table already exists
  const girlsTableExists = await knex.schema.hasTable("girls");
  // If it doesn't exist, create the "users" table
  if (!girlsTableExists) {
    await knex.schema
      .createTable("girls", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.string("email").notNullable().unique(); // Non-nullable email field
        table.string("username").unique(); // This will show to users
        table.string("password").notNullable(); // Non-nullable password field
        table.string("photo").notNullable();
        table.string("video").notNullable();
        table.boolean("is_active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "conversations" table already exists
  const conversationsTableExists = await knex.schema.hasTable("conversations");
  if (!conversationsTableExists) {
    await knex.schema
      .createTable("conversations", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("user_id").unsigned().notNullable();
        table.integer("girl_id").unsigned().notNullable();
        table.text("message").notNullable();
        table.enu("sender", ["user", "girl"]).notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());

        table.foreign("user_id").references("users.id");
        table.foreign("girl_id").references("girls.id");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "subscription" table already exists
  const subscriptionTableExists = await knex.schema.hasTable("subscription");
  // If it doesn't exist, create the "subscription" table
  if (!subscriptionTableExists) {
    await knex.schema
      .createTable("subscription", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("user_id").unsigned(); // Unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // Foreign key reference to 'id' in 'users' table
        table.timestamp("subscription_renew_date").defaultTo(knex.fn.now()); // Timestamp
        table
          .enu("subscription_status", ["active", "in-active"])
          .notNullable()
          .defaultTo("avatar-talk"); // Enum for subscription type with default value
        table
          .enu("subscription_type", [
            "free", // 0
            "avatar-talk", // $5
            "real-girl-text-chat", // $10
            "real-girl-audio-chat", // $50
            "real-girl-video-chat", // $100
            "real-girl-video-chat", // $500
          ])
          .notNullable()
          .defaultTo("avatar-talk"); // Enum for subscription type with default value
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "transactions" table already exists
  const transactionsTableExists = await knex.schema.hasTable("transactions");
  // If it doesn't exist, create the "transactions" table
  if (!transactionsTableExists) {
    await knex.schema
      .createTable("transactions", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("user_id").unsigned(); // Unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // Foreign key reference to 'id' in 'users' table
        table
          .enu("transactions_type", ["subscription", "add-on", "orders"])
          .notNullable()
          .defaultTo("subscription"); // Enum for subscription type with default value
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "orders" table already exists
  const ordersTableExists = await knex.schema.hasTable("orders");
  // If it doesn't exist, create the "orders" table
  if (!ordersTableExists) {
    await knex.schema
      .createTable("orders", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table
          .enu("order_type", [
            "3-personalized-photo", // $10
            "5-personalized-photo", // $10
            "10-personalized-photo", // $20
            "1-videoo", // $20
            "1-personalized-video", // $50
          ])
          .notNullable()
          .defaultTo("3-personalized-photo"); // Enum for order type with default value

        table
          .enu("order_status", ["requested", "delivered"])
          .notNullable()
          .defaultTo("free"); // Enum for order status with default value

        table.integer("girl_id").unsigned(); // unsigned integer column for 'girl_id'
        table.foreign("girl_id").references("girls.id"); // foreign key reference to 'id' in 'girls' table

        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table

        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
        table
          .timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .onUpdate(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "avatar_talk_limit" table already exists
  const avatarTalkLimitTableExists = await knex.schema.hasTable(
    "avatar_talk_limit"
  );
  // If it doesn't exist, create the "avatar_talk_limit" table
  if (!avatarTalkLimitTableExists) {
    await knex.schema
      .createTable("avatar_talk_limit", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("talk_limit").defaultTo(30); // $5 for Unlimited talk
        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
        table
          .timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .onUpdate(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "text_talk_limit" table already exists
  const textTalkLimitTableExists = await knex.schema.hasTable(
    "text_talk_limit"
  );
  // If it doesn't exist, create the "text_talk_limit" table
  if (!textTalkLimitTableExists) {
    await knex.schema
      .createTable("text_talk_limit", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("talk_limit").defaultTo(60); // $5 for 60 minutes add-on
        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
        table
          .timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .onUpdate(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "audio_talk_limit" table already exists
  const audioTalkLimitTableExists = await knex.schema.hasTable(
    "audio_talk_limit"
  );
  // If it doesn't exist, create the "audio_talk_limit" table
  if (!audioTalkLimitTableExists) {
    await knex.schema
      .createTable("audio_talk_limit", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("talk_limit").defaultTo(60); // $20 for 60 minutes add-on
        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
        table
          .timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .onUpdate(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "video_talk_limit" table already exists
  const videoTalkLimitTableExists = await knex.schema.hasTable(
    "video_talk_limit"
  );
  // If it doesn't exist, create the "video_talk_limit" table
  if (!videoTalkLimitTableExists) {
    await knex.schema
      .createTable("video_talk_limit", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.integer("talk_limit").defaultTo(60); // $100 for 60 minutes add-on
        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table
        table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp
        table
          .timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .onUpdate(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Check if the "gallery" table already exists
  const galleryTableExists = await knex.schema.hasTable("gallery");
  // If it doesn't exist, create the "gallery" table
  if (!galleryTableExists) {
    await knex.schema
      .createTable("gallery", function (table) {
        table.increments("id").primary(); // Auto-incremental primary key
        table.string("photo");

        table.integer("girl_id").unsigned(); // unsigned integer column for 'girl_id'
        table.foreign("girl_id").references("girls.id"); // foreign key reference to 'id' in 'girls' table

        table.integer("user_id").unsigned(); // unsigned integer column for 'user_id'
        table.foreign("user_id").references("users.id"); // foreign key reference to 'id' in 'users' table

        table.timestamp("created_at").defaultTo(knex.fn.now());
      })
      .catch((err) => {
        console.log(err);
      });
  }

  console.log("process completed");
  return true;
};

migrate();
