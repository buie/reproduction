import {
  Entity,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
} from "@mikro-orm/sqlite";

@Entity()
class Location {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  address: string;

  constructor(name: string, address: string) {
    this.name = name;
    this.address = address;
  }
}
@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToOne(() => Location)
  location: Rel<Location>;

  constructor(name: string, email: string, location: Location) {
    this.name = name;
    this.email = email;
    this.location = location;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example", async () => {
  orm.em.create(User, {
    name: "Foo",
    email: "foo",
    location: new Location("home", "123 Main St"),
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: "foo" });
  expect(user.name).toBe("Foo");
  user.name = "Bar";
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: "foo" });
  expect(count).toBe(0);
});

test("types dont represent populate", async () => {
  orm.em.create(User, {
    name: "Foo",
    email: "foo",
    location: new Location("home", "123 Main St"),
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: "foo" });
  expect(user.name).toBe("Foo");

  // the types don't represent the populated entity, the type indicates that name is a string but it is undefined therefore this test fails
  expect(user.location.name).toBe("home");
  user.name = "Bar";
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: "foo" });
  expect(count).toBe(0);
});
