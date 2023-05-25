-- Remove foreign key constraints.
SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT = 0;

-- Drops the Drugs table if it exists.
DROP TABLE IF EXISTS Drugs;

-- Creates the Drugs table.
CREATE TABLE Drugs (
  drugID INTEGER PRIMARY KEY AUTO_INCREMENT,
  drugName VARCHAR(255) NOT NULL,
  drugPropName VARCHAR(255),
  drugStrength VARCHAR(255) NOT NULL,
  drugForm VARCHAR(255) NOT NULL,
  drugATC VARCHAR(255) NOT NULL,
  drugNDC VARCHAR(255) NOT NULL,
  storeFridge BIT NOT NULL,
  storeFreezer BIT NOT NULL,
  totalQuantity INTEGER NOT NULL,
  earlyExpiration DATE NOT NULL
);

-- Drops the Orders table if it exists.
DROP TABLE IF EXISTS Orders;

-- Creates the Orders table.
CREATE TABLE Orders (
  orderID INTEGER PRIMARY KEY AUTO_INCREMENT,
  orderDate DATE NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL
);

-- Drops the Vendors table if it exists.
DROP TABLE IF EXISTS Vendors;

-- Creates the Vendors table.
CREATE TABLE Vendors (
  vendorID INTEGER PRIMARY KEY AUTO_INCREMENT,
  vendorName VARCHAR(255) NOT NULL,
  contactPerson VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zipCode INTEGER(5) NOT NULL
);

-- Drops the OrderDetails table if it exists.
DROP TABLE IF EXISTS OrderDetails;

-- Creates the OrderDetails table. For records purposes,
-- constraints are set to prevent deleting drugs and vendors
-- that have been associated with an order already.
CREATE TABLE OrderDetails (
  orderDetailsID INTEGER PRIMARY KEY AUTO_INCREMENT,
  drugID INTEGER NOT NULL,
  orderID INTEGER NOT NULL,
  vendorID INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  expiryDate DATE NOT NULL,
  lotNumber VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  FOREIGN KEY (drugID) REFERENCES Drugs(drugID) ON DELETE RESTRICT,
  FOREIGN KEY (orderID) REFERENCES Orders(orderID) ON DELETE RESTRICT,
  FOREIGN KEY (vendorID) REFERENCES Vendors(vendorID) ON DELETE RESTRICT
);

-- Drops the VendorDrugs table if it exists.
DROP TABLE IF EXISTS VendorDrugs;

-- Creates the VendorDrugs table. If a drug or vendor is deleted
-- deletes the association between them.
CREATE TABLE VendorDrugs (
  vendorDrugsID INTEGER PRIMARY KEY AUTO_INCREMENT,
  vendorID INTEGER NOT NULL,
  drugID INTEGER NOT NULL,
  unitPrice DECIMAL(10, 2) NOT NULL,
  discountOffered INTEGER,
  FOREIGN KEY (vendorID) REFERENCES Vendors(vendorID) ON DELETE CASCADE,
  FOREIGN KEY (drugID) REFERENCES Drugs(drugID) ON DELETE CASCADE
);

-- Drops the Locations table if it exists.
DROP TABLE IF EXISTS Locations;

-- -- Creates the Locations table.
CREATE TABLE Locations (
  locationID INTEGER PRIMARY KEY AUTO_INCREMENT,
  locationName VARCHAR(255) NOT NULL,
  room VARCHAR(255) NOT NULL
);

-- Drops the Shelves table if it exists.
DROP TABLE IF EXISTS Shelves;

-- Creates the Shelves table. A shelf is in a location. If a location
-- is deleted for any reason (e.g. renovation) and the self is not 
-- planned to be used in the future, deletes the association.
-- Performs data validation to prevent wrong inputs.
CREATE TABLE Shelves (
  shelfID INTEGER PRIMARY KEY AUTO_INCREMENT,
  locationID INTEGER NOT NULL,
  shelfCode VARCHAR(3) NOT NULL,
  fridge BIT NOT NULL,
  freezer BIT NOT NULL,
  FOREIGN KEY (locationID) REFERENCES Locations(locationID) ON DELETE CASCADE,
  CHECK (
    (shelfCode REGEXP '^[A-Z][0-9][0-9]$') OR
    (shelfCode REGEXP '^[A-Z][A-Z][0-9]$')
  )
);

-- Drops the DrugLocations table if it exists.
DROP TABLE IF EXISTS DrugLocations;

-- Creates the DrugLocations table. If a drug or a shelf is deleted
-- removes the association. Performs data validation to prevent
-- wrong inputs.
CREATE TABLE DrugLocations (
  drugID INTEGER,
  shelfID INTEGER,
  containerCode VARCHAR(4),
  capacity INTEGER NOT NULL,
  availability INTEGER NOT NULL,
  PRIMARY KEY (drugID, shelfID, containerCode),
  FOREIGN KEY (drugID) REFERENCES Drugs(drugID) ON DELETE CASCADE,
  FOREIGN KEY (shelfID) REFERENCES Shelves(shelfID) ON DELETE CASCADE,
  CHECK (containerCode REGEXP '^[0-9][0-9]-[0-9]$')
);

-- Drops the Ingredients table if it exists.
DROP TABLE IF EXISTS Ingredients;

-- Create the Ingredients table. 
CREATE TABLE Ingredients (
  ingredientID INTEGER AUTO_INCREMENT PRIMARY KEY,
  ingredientName VARCHAR(255) NOT NULL
);

-- Drops the DrugIngredients table if it exists.
DROP TABLE IF EXISTS DrugIngredients;

-- Creates the DrugIngredients table. 
CREATE TABLE DrugIngredients (
  drugIngredientsID INTEGER AUTO_INCREMENT PRIMARY KEY,
  drugID INTEGER NOT NULL,
  ingredientID INTEGER,
  FOREIGN KEY (drugID) REFERENCES Drugs(drugID),
  FOREIGN KEY (ingredientID) REFERENCES Ingredients(ingredientID) ON DELETE SET NULL
);

-- Sample data for Drugs.
INSERT INTO Drugs (
  drugName,
  drugPropName,
  drugStrength,
  drugForm,
  drugATC,
  drugNDC,
  storeFridge,
  storeFreezer,
  totalQuantity,
  earlyExpiration
)
VALUES
(
  'Acetaminophen',
  NULL,
  '650mg',
  'Tablet ER',
  'N02BE01',
  '11822-5019-2',
  0,
  0,
  12000,
  '2024-01-31'
),
(
  'Filgrastim',
  'Neulasta',
  '300mcg/0.5mL',
  'Syringe',
  'L03AA02',
  '55513-924-10',
  1,
  0,
  300,
  '2023-12-31'
),
(
  'Capecitabine',
  'Capecitabine',
  '500mg',
  'Tablet',
  'L01BC06',
  '55111-497-04',
  0,
  0,
  3600,
  '2024-04-30'
),
(
  'Pembrolizumab',
  'Keytruda',
  '100mg/4mL',
  'Vial',
  'L01FF02',
  '0006-3026-02',
  1,
  0,
  200,
  '2023-11-30'
),
(
  'Dinoprostone',
  'Cervidil',
  '10mg',
  'Vaginal insert ER',
  'G02AD02',
  '55566-2800-1',
  0,
  1,
  15,
  '2023-12-31'
);


-- Sample data for Orders
INSERT INTO Orders (
  orderDate,
  totalPrice
)
VALUES
(
  '2022-10-05',
  12000.00
),
(
  '2023-01-15',
  800.00
),
(
  '2023-04-02',
  23500.50
);

-- Sample data for Vendors
INSERT INTO Vendors (
  vendorName,
  contactPerson,
  phoneNumber,
  email,
  street,
  city,
  state,
  zipCode
)
VALUES
(
  'ABC Pharma',
  'John Smith',
  '555-1234',
  'jsmith@abcpharma.com',
  '123 Main St',
  'Austin',
  'Texas',
  78701
),
(
  'DEF Pharma',
  'Jane Doe',
  '555-5678',
  'jdoe@defpharma.com',
  '456 Main St',
  'Seattle',
  'Washington',
  98101
),
(
  'GHI Pharma',
  'Mark Williams',
  '555-9012',
  'mwill@ghipharma.com',
  '789 Main St',
  'Boston',
  'Massachusetts',
  02108
);

-- Sample data for VendorDrugs
INSERT INTO VendorDrugs (
  vendorID,
  drugID,
  unitPrice,
  discountOffered
)
VALUES
(
  1,
  1,
  0.25,
  80
),
(
  2,
  2,
  225,
  10
),
(
  3,
  3,
  93.67,
  5
),
(
  2,
  4,
  3566,
  NULL
),
(
  3,
  5,
  214,
  NULL
);

-- Sample data for Locations
INSERT INTO Locations (
  locationName,
  room
)
VALUES
(
  'Main Pharmacy',
  'Horizontal Carousel'
),
(
  'Main Pharmacy',
  'Vertical Carousel'
),
(
  'Oncology Pharmacy',
  'Preparation room'
),
(
  'Oncology Pharmacy',
  'Main Storage'
),
(
  'Maternity Pharmacy',
  'Main Storage'
);

-- Sample data for Shelves
INSERT INTO Shelves (
  locationID,
  shelfCode,
  fridge,
  freezer
)
VALUES
(
  1,
  'F01',
  1,
  0
),
(
  2,
  'A01',
  0,
  0
),
(
  3,
  'B02',
  1,
  0
),
(
  4,
  'C03',
  0,
  0
),
(
  5,
  'FR1',
  0,
  1
);

-- Sample data for DrugLocations
INSERT INTO DrugLocations (
  drugID,
  shelfID,
  containerCode,
  capacity,
  availability
)
VALUES
(
  1,
  2,
  '10-1',
  500,
  423
),
(
  1,
  2,
  '10-2',
  500,
  45
),
(
  2,
  1,
  '01-2',
  50,
  32
),
(
  3,
  4,
  '03-1',
  1000,
  960
),
(
  4,
  3,
  '05-2',
  50,
  30
),
(
  5,
  5,
  '01-1',
  10,
  6
);
  
-- Sample data for OrderDetails
INSERT INTO OrderDetails (
  drugID,
  orderID,
  vendorID,
  quantity,
  expiryDate,
  lotNumber,
  status
)
VALUES 
(
  1,
  2,
  1,
  10000,
  '2023-06-01',
  'LOT001',
  'Pending'
),
(
  2,
  1,
  1,
  50,
  '2023-07-01',
  'LOT002',
  'Received'
),
(
  3,
  1,
  2,
  2000,
  '2023-08-01',
  'LOT003',
  'Shipped'
),
(
  4,
  3,
  2,
  30,
  '2023-09-01',
  'LOT004',
  'Delivered'
),
(
  5,
  3,
  3,
  10,
  '2023-10-01',
  'LOT005',
  'Cancelled'
),
(
  1,
  3,
  1,
  2000,
  '2024-10-01',
  'LOT034',
  'Cancelled'
);

-- Sample data for Ingredients
INSERT INTO Ingredients (
  ingredientName
)
VALUES
(
  'Lactose'
),
(
  'Benzyl alcohol'
),
(
  'Aspartame'
);

-- Sample data for DrugIngredients
INSERT INTO DrugIngredients (
  drugID,
  ingredientID
)
VALUES
(
  1,
  1
),
(
  1,
  3
),
(
  2,
  2
),
(
  3,
  1
);

SET FOREIGN_KEY_CHECKS=1;
COMMIT;