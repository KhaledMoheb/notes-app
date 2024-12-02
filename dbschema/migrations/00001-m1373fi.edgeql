CREATE MIGRATION m1373fiiicuumvqm5h5654t6gvskgnr6gtdfk2ppiw6fzmaoi35mba
    ONTO initial
{
  CREATE TYPE default::Note {
      CREATE OPTIONAL PROPERTY deleted: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE OPTIONAL PROPERTY pinned: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY tagId: std::int16;
      CREATE REQUIRED PROPERTY timestamp: std::datetime;
      CREATE REQUIRED PROPERTY title: std::str;
      CREATE REQUIRED PROPERTY userId: std::str;
  };
};
