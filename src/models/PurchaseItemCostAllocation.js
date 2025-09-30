const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseItemCostAllocation = sequelize.define('PurchaseItemCostAllocation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    purchaseItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_items',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('percentage', 'amount'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    allocatedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'purchase_item_cost_allocations',
    timestamps: true
  });

  PurchaseItemCostAllocation.associate = (models) => {
    PurchaseItemCostAllocation.belongsTo(models.PurchaseItem, {
      foreignKey: 'purchaseItemId',
      as: 'purchaseItem'
    });
  };

  return PurchaseItemCostAllocation;
}; 