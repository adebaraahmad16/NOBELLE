-- Invariants enforced independently of the application.
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_nonnegative` CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity);
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_positive_quantity` CHECK (quantity > 0);
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_positive_quantity` CHECK (quantity > 0);
ALTER TABLE `ReturnItem` ADD CONSTRAINT `ReturnItem_positive_quantity` CHECK (quantity > 0);
ALTER TABLE `Review` ADD CONSTRAINT `Review_rating_range` CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE `Product` ADD CONSTRAINT `Product_positive_price` CHECK (price > 0);
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_nonnegative_amount` CHECK (amount >= 0);
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_valid_value` CHECK (value > 0 AND (`discountType` <> 'PERCENTAGE' OR value <= 100));
ALTER TABLE `Order` ADD CONSTRAINT `Order_valid_totals` CHECK (subtotal >= 0 AND `discountTotal` >= 0 AND `discountTotal` <= subtotal AND `deliveryFee` >= 0 AND `totalAmount` = subtotal - `discountTotal` + `deliveryFee`);
ALTER TABLE `PaymentRefund` ADD CONSTRAINT `Refund_positive_amount` CHECK (amount > 0);

-- Nullable generated columns replace PostgreSQL partial unique indexes.
ALTER TABLE `Payment`
  ADD COLUMN `successfulOrderId` VARCHAR(191) GENERATED ALWAYS AS (CASE WHEN status = 'SUCCESS' THEN `orderId` ELSE NULL END) VIRTUAL,
  ADD COLUMN `pendingOrderId` VARCHAR(191) GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN `orderId` ELSE NULL END) VIRTUAL,
  ADD UNIQUE INDEX `Payment_one_success_per_order` (`successfulOrderId`),
  ADD UNIQUE INDEX `Payment_one_pending_per_order` (`pendingOrderId`);
ALTER TABLE `Address`
  ADD COLUMN `defaultCustomerId` VARCHAR(191) GENERATED ALWAYS AS (CASE WHEN `isDefault` = true THEN `customerId` ELSE NULL END) VIRTUAL,
  ADD UNIQUE INDEX `Address_one_default_per_customer` (`defaultCustomerId`);

-- MySQL forbids CHECK expressions on columns with cascading foreign keys.
CREATE TRIGGER `Cart_exactly_one_owner_insert` BEFORE INSERT ON `Cart` FOR EACH ROW
BEGIN
  IF (NEW.`customerId` IS NULL) = (NEW.`guestTokenHash` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart must have exactly one owner';
  END IF;
END;
CREATE TRIGGER `Cart_exactly_one_owner_update` BEFORE UPDATE ON `Cart` FOR EACH ROW
BEGIN
  IF (NEW.`customerId` IS NULL) = (NEW.`guestTokenHash` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart must have exactly one owner';
  END IF;
END;
