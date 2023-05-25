-- Query for adding a new drug with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO Drugs (drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration)
VALUES (:drugName, :drugPropName, :drugStrength, :drugForm, :drugATC, :drugNDC, :storeFridge, :storeFreezer, :totalQuantity, :earlyExpiration);

-- Shows all drugs stored in the database.
SELECT * FROM Drugs;

-- Shows a specific drug
SELECT * FROM Drugs 
WHERE drugName = :drugName;

-- Dynamic search functionality to get the ID of the drug based on the desired name.
SELECT drugID FROM Drugs 
WHERE drugName 
LIKE CONCAT('%', :search, '%');

-- Query to use the search functionality from the main screen.
SELECT *
FROM Drugs
WHERE 1=1
  AND (drugName = :drugName OR :drugName IS NULL)
  AND (drugPropName = :drugPropName OR :drugPropName IS NULL)
  AND (drugStrength = :drugStrength OR :drugStrength IS NULL)
  AND (drugForm = :drugForm OR :drugForm IS NULL)
  AND (drugATC = :drugATC OR :drugATC IS NULL)
  AND (drugNDC = :drugNDC OR :drugNDC IS NULL)
  AND (storeFridge = :storeFridge OR :storeFridge IS NULL)
  AND (storeFreezer = :storeFreezer OR :storeFreezer IS NULL)
  AND (totalQuantity = :totalQuantity OR :totalQuantity IS NULL)
  AND (earlyExpiration = :earlyExpiration OR :earlyExpiration IS NULL);


-- Update query for drugs
UPDATE Drugs
SET drugName = :newDrugName,
    drugPropName = :newDrugPropName,
    drugStrength = :newDrugStrength,
    drugForm = :newDrugForm,
    drugATC = :newDrugATC,
    drugNDC = :newDrugNDC,
    storeFridge = :newStoreFridge,
    storeFreezer = :newStoreFreezer,
    totalQuantity = :newTotalQuantity,
    earlyExpiration = :newEarlyExpiration
WHERE drugID = (
  SELECT drugID
  FROM Drugs
  WHERE drugName = :drugName
);

-- Show all orders stored in the database including information
-- from OrderDetails to make it more user friendly.
SELECT OrderDetails.status, Drugs.drugName, Vendors.vendorName, Orders.OrderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
FROM OrderDetails
INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID;

-- Show all orders from a specific date
SELECT OrderDetails.status, Drugs.drugName, Vendors.vendorName, Orders.OrderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
FROM OrderDetails
INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID
WHERE 1=1
  AND (orderDate = DATE(:search) OR orderDate IS NULL)
  AND (drugName = :drugName OR drugName IS NULL)
  AND (vendorName = :vendorName OR vendorName IS NULL);

-- Query for getting orderID from other fields. Because several
-- orders can share a date, we use both attributes
SELECT OrderID FROM Orders 
WHERE orderDate = :orderDate 
  AND totalPrice = :totalPrice; 

-- Query for adding a new order with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO Orders (orderDate, totalPrice)
VALUES (:orderDate, :totalPrice);

-- Query for adding new orderdetails with colon : character being used to 
-- denote the variables that will have data from the backend programming language.
INSERT INTO OrderDetails (drugID, orderID, vendorID, quantity, expiryDate, lotNumber, status)
VALUES (
  (SELECT drugID FROM Drugs WHERE drugName = :drugName),
  (SELECT orderID FROM Orders WHERE orderDate = :orderDate AND totalPrice = :totalPrice),
  (SELECT vendorID FROM Vendors WHERE vendorName = :vendorName),
  :quantity,
  :expiryDate,
  :lotNumber,
  :status;
);

-- Query for adding a new vendor with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO Vendors (vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode)
VALUES (:vendorName, :contactPerson, :phoneNumber, :email, :street, :city, :state, :zipCode);

-- Show all vendors stored in the database
SELECT * FROM Vendors;

-- Search functionality for Vendors page.
SELECT *
FROM Vendors
WHERE 1=1
  AND (vendorName = :vendorName OR :vendorName IS NULL)
  AND (contactPerson = :contactPerson OR :contactPerson IS NULL)
  AND (phoneNumber = :phoneNumber OR :phoneNumber IS NULL)
  AND (email = :email OR :email IS NULL)
  AND (street = :street OR :street IS NULL)
  AND (city = :city OR :city IS NULL)
  AND (state = :state OR :state IS NULL)
  AND (zipCode = :zipCode OR :zipCode IS NULL);

-- Query for adding new vendordrugs with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO VendorDrugs (vendorID, drugID, unitPrice, discountOffered)
VALUES (
  (SELECT vendorID FROM Vendors WHERE vendorName = :vendorName),
  (SELECT drugID FROM Drugs WHERE drugName = :drugName),
  :unitPrice, 
  :discountOffered
);

-- Show all vendordrugs information for a specified vendor.
SELECT Drugs.drugName, VendorDrugs.unitPrice, vendorDrugs.discountOffered
FROM VendorDrugs
INNER JOIN Drugs ON VendorDrugs.drugID = Drugs.drugID
WHERE VendorDrugs.vendorID = (SELECT vendorID FROM Vendors WHERE vendorName = :vendorName);

-- Query for adding a new location with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO Locations (locationName, room)
VALUES (:locationName, :room);

-- Show all locations stored in the database
SELECT * FROM Locations;

-- Search functionality for locations page.
SELECT * FROM Locations
WHERE 1=1
  AND (locationName = :locationName OR locationName IS NULL)
  AND (room = :room OR room IS NULL);

-- Select functionality for Shelves page that joins Shelf and DrugLocations.
SELECT Shelves.shelfCode, Shelves.fridge, Shelves.freezer, Locations.locationName, Locations.room, DrugLocations.containerCode, Drugs.drugName, DrugLocations.capacity, DrugLocations.availability
FROM Shelves
LEFT JOIN DrugLocations ON DrugLocations.shelfID = Shelves.shelfID
LEFT JOIN Drugs ON DrugLocations.drugID = Drugs.drugID
LEFT JOIN Locations ON Shelves.locationID = Locations.locationID;

-- Query for adding new shelves with colon : character being used to 
-- denote the variables that will have data from the backend programming language
INSERT INTO Shelves (locationID, shelfCode, fridge, freezer)
VALUES (
  (SELECT LocationID FROM Locations WHERE locationName = :locationName AND room = :room),
  :shelfCode, 
  :fridge, 
  :freezer
);

-- Query for adding new druglocations with colon : character being used to 
-- denote the variables that will have data from the backend programming language.
INSERT INTO DrugLocations (drugID, shelfID, containerCode, availability, capacity)
VALUES (
  (SELECT drugID FROM Drugs WHERE drugName = :drugName),
  (SELECT shelfID FROM Shelves WHERE shelfCode = :shelfCode),
  :containerCode, 
  :availability, 
  :capacity
);

-- Search functionality for Shelves.
SELECT Shelves.shelfCode, Shelves.fridge, Shelves.freezer, Locations.locationName, Locations.room, DrugLocations.containerCode, Drugs.drugName, DrugLocations.capacity, DrugLocations.availability
FROM Shelves
LEFT JOIN DrugLocations ON DrugLocations.shelfID = Shelves.shelfID
LEFT JOIN Drugs ON DrugLocations.drugID = Drugs.drugID
LEFT JOIN Locations ON Shelves.locationID = Locations.locationID
WHERE 1=1
  AND (Shelves.shelfCode = :shelfCode OR :shelfCode IS NULL)
  AND (Shelves.fridge = :fridge OR :fridge IS NULL)
  AND (Shelves.freezer = :freezer OR :freezer IS NULL)
  AND (Locations.locationName = :locationName OR :locationName IS NULL)
  AND (Locations.room = :room OR :room IS NULL)
  AND (DrugLocations.containerCode = :containerCode OR :containerCode IS NULL)
  AND (Drugs.drugName = :drugName OR :drugName IS NULL)
  AND (DrugLocations.capacity = :capacity OR :capacity IS NULL)
  AND (DrugLocations.availability = :availability OR :availability IS NULL);


-- Query to delete a drug-location association.
DELETE FROM DrugLocations
WHERE drugID = (
  SELECT drugID FROM Drugs WHERE drugName = :drugName
)
AND shelfID = (
  SELECT shelfID FROM Shelves WHERE shelfCode = :shelfCode
);

-- Query to insert new ingredients in the ingredient table.
INSERT INTO Ingredients (ingredientName)
VALUES (:ingredientName);

-- Query to show all ingredients stored in the ingredients table.
SELECT * FROM Ingredients;

-- Query to show a specific ingredient based on its name.
SELECT * FROM Ingredients
WHERE ingredientName = :ingredientName;

-- Query to insert a new drug-ingredient relationship.
INSERT INTO DrugIngredients (drugID, ingredientID)
VALUES (
  (SELECT DrugID FROM Drugs WHERE drugName = :drugName),
  (SELECT ingredientID FROM Ingredients WHERE ingredientName = :ingredientName)
);

-- Query to show all drug-ingredients relationships.
SELECT * FROM DrugIngredients;

-- Query to show all ingredients associated with a specific drug.
SELECT * FROM DrugIngredients
WHERE drugID = (
  SELECT drugID FROM Drugs WHERE drugName = :drugName
);

-- Query to update a drug-ingredient relationship setting ingredient
-- ID to NULL.
UPDATE DrugIngredients
SET ingredientID = NULL
WHERE drugID = (
  SELECT DrugID FROM Drugs WHERE drugName = ?
);

-- New queries
--

SELECT Locations.locationName, Locations.room, Shelves.shelfCode, Shelves.fridge, Shelves.freezer, DrugLocations.containerCode, DrugLocations.capacity, DrugLocations.availability
FROM DrugLocations
INNER JOIN Shelves ON Shelves.shelfID = DrugLocations.shelfID
INNER JOIN Locations ON Shelves.locationID = Locations.locationID
WHERE DrugLocations.drugID = (
  SELECT drugID FROM Drugs WHERE drugName = :drugName
);

-- Added the where filter
SELECT OrderDetails.status, Drugs.drugName, Vendors.vendorName, Orders.OrderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
FROM OrderDetails
INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID
WHERE Drugs.drugID = (
  SELECT DrugID FROM Drugs WHERE drugName = :drugName
);

-- New one
SELECT Vendors.vendorName, Vendors.contactPerson, Vendors.phoneNumber, Vendors.street, Vendors.city, Vendors.state, Vendors.zipCode, VendorDrugs.unitPrice, VendorDrugs.discountOffered
FROM VendorDrugs
INNER JOIN Vendors ON Vendors.vendorID = VendorDrugs.vendorID
WHERE VendorDrugs.drugID = (
  SELECT DrugID FROM Drugs WHERE drugName = :drugName
);

SELECT IngredientName 
FROM Ingredients
INNER JOIN DrugIngredients ON Ingredients.ingredientID = DrugIngredients.ingredientID
WHERE DrugIngredients.drugID = (
  SELECT drugID FROM Drugs WHERE drugName = ?
);

DELETE FROM DrugLocations
  WHERE drugID = (
    SELECT drugID FROM Drugs WHERE drugName = ?
  )
  AND shelfID = (
    SELECT shelfID FROM Shelves WHERE shelfCode = ?
  )
  AND containerCode = ?;

SELECT locationID
FROM Locations
WHERE locationName = ?
AND room = ?;

SELECT shelfID
FROM Shelves
INNER JOIN Locations ON Shelves.locationID = (
  SELECT locationID FROM Locations
  WHERE locationName = ?
  AND room = ?;
)
WHERE Shelves.shelfCode = ?
AND Shelves.fridge = ?
AND Shelves.freezer = ?;

SELECT drugID FROM Drugs
WHERE drugName = ?;

INSERT INTO DrugLocations (shelfID, drugID)
VALUES (shelfID, drugID)
WHERE shelfID = (
  SELECT shelfID FROM Shelves WHERE locationID = (
    SELECT locationID FROM Locations WHERE locationName = ?
    AND room = ?
  )
);

INSERT INTO Shelves (shelfCode, fridge, freezer)
VALUES (?, ?, ?);

INSERT INTO DrugLocations (containerCode, capacity, availability)
VALUES (?, ?, ?);
