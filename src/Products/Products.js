import { useEffect, useState } from "react";
import {
  isEmpty,
  isString,
  isBoolean,
  isNumber,
  toLower,
  isNil,
  fromPairs,
} from "lodash";
import axios from "axios";
function Products() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ order: "asc", orderBy: "id" });
  const [allCategories, setCategory] = useState([]);
  const [formObject, setFormObject] = useState({
    id: 0,
    name: "",
    category: "",
    price: "",
    stocked: false,
  });

  const handleSort = (accessor) => {
    setSort((prevSort) => ({
      order:
        prevSort.order === "asc" && prevSort.orderBy === accessor
          ? "desc"
          : "asc",
      orderBy: accessor,
    }));
  };

  const getNewId = () => {
    let maxId = 0;
    products.forEach((prod) => {
      if (prod.id > maxId) {
        maxId = parseInt(prod.id);
      }
    });
    let newId = maxId + 1;
    return newId;
  };

  function sortRows(rows, sort) {
    return rows.sort((a, b) => {
      const { order, orderBy } = sort;

      if (isNil(a[orderBy])) return 1;
      if (isNil(b[orderBy])) return -1;

      const aLocale = a[orderBy].toString();
      const bLocale = b[orderBy].toString();

      if (order === "asc") {
        return aLocale.localeCompare(bLocale, "en", {
          numeric: isNumber(b[orderBy]),
        });
      } else {
        return bLocale.localeCompare(aLocale, "en", {
          numeric: isNumber(a[orderBy]),
        });
      }
    });
  }

  function filterRows(rows, filters) {
    if (
      isEmpty(filters) ||
      (Object.keys(filters).length === 1 &&
        filters.category === "Select Category")
    )
      return rows;
    return rows.filter((row) => {
      return Object.keys(filters).every((accessor) => {
        const value = row[accessor];
        const searchValue = filters[accessor];
        if (searchValue !== "Select Category") {
          if (isString(value)) {
            return toLower(value).includes(toLower(searchValue));
          }
          if (isBoolean(value)) {
            return (
              (searchValue === true && value) ||
              (searchValue === false && !value)
            );
          }
          if (isNumber(value)) {
            return value === searchValue;
          }
          return false;
        } else {
          return true;
        }
      });
    });
  }

  const handleSearch = (value, accessor) => {
    if (value) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [accessor]: value,
      }));
    } else {
      setFilters((prevFilters) => {
        const updatedFilters = { ...prevFilters };
        delete updatedFilters[accessor];
        return updatedFilters;
      });
    }
  };

  const filteredRows = filterRows(products, filters);
  const sortedRows = sortRows(filteredRows, sort);
  const calculatedRows = sortedRows;

  const columns = [
    { accessor: "name", label: "Name" },
    { accessor: "category", label: "Category" },
    { accessor: "price", label: "Price" },
    { accessor: "stocked", label: "Stocked" },
  ];

  const url = "http://localhost:3030/products";
  const fetchData = async () => {
    const fetchedData = await axios.get(url);
    const content = fetchedData.data;
    setProducts(content);
  };

  const onFormSubmit = async (event) => {
    event.preventDefault();
    let newId = getNewId();
    await setFormObject((prevState) => ({
      ...prevState,
      id: newId,
    }));
    const checkValue = !Object.values(formObject).every((res) => isEmpty(res));
    if (checkValue) {
      postData();
      const dataObj = (data) => [...data, { ...formObject, id: newId }];
      setProducts(dataObj);
      const defaultData = {
        id: 0,
        name: "",
        category: "",
        price: "",
        stocked: false,
      };
      setFormObject(defaultData);
    }
  };

  const onValueChange = (event) => {
    const value = (res) => ({
      ...res,
      [event.target.name]: event.target.value,
    });
    setFormObject(value);
  };

  const onChangeStocked = () => {
    const value = (res) => ({
      ...res,
      stocked: !formObject.stocked,
    });
    setFormObject(value);
  };

  const postData = async () => {
    return await axios.post(url, formObject);
  };

  const deleteProduct = async (idToRemove) => {
    const index = products.findIndex(({ id }) => id === idToRemove);
    if (index !== -1) {
      setProducts([...products.slice(0, index), ...products.slice(index + 1)]);
    }
    return await axios.delete(`${url}/${idToRemove}`);
  };

  useEffect(() => {
    let timerFunc = setTimeout(() => fetchData(), 100);
    return () => clearTimeout(timerFunc);
  }, []);

  useEffect(() => {
    let localProds = products;
    let allCat = [];
    localProds.forEach((prod) => {
      allCat.push(prod.category);
    });
    let res = [];
    res = allCat.filter((x, i, a) => a.indexOf(x) === i);
    res.unshift("Select Category");
    setCategory(res);
  }, [products]);

  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const sortIcon = () => {
                if (column.accessor === sort.orderBy) {
                  if (sort.order === "asc") {
                    return "⬆️";
                  }
                  return "⬇️";
                } else {
                  return "️↕️";
                }
              };
              return (
                <th key={column.accessor}>
                  <span>{column.label}</span>
                  <button onClick={() => handleSort(column.accessor)}>
                    {sortIcon()}
                  </button>
                </th>
              );
            })}
          </tr>
          <tr>
            {columns.map((column) => {
              if (column.accessor === "stocked") {
                return (
                  <th>
                    <input
                      key={`${column.accessor}-search`}
                      type="checkbox"
                      value={filters[column.accessor]}
                      onChange={(event) =>
                        handleSearch(event.target.checked, column.accessor)
                      }
                    />
                  </th>
                );
              } else if (column.accessor === "category") {
                return (
                  <th>
                    <select
                      key={`${column.accessor}-search`}
                      defaultValue="Select Category"
                      onChange={(event) =>
                        handleSearch(event.target.value, column.accessor)
                      }
                    >
                      {allCategories.map((cat) => {
                        return (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        );
                      })}
                    </select>
                  </th>
                );
              } else {
                return (
                  <th>
                    <input
                      key={`${column.accessor}-search`}
                      type="search"
                      placeholder={`Search ${column.label}`}
                      value={filters[column.accessor]}
                      onChange={(event) =>
                        handleSearch(event.target.value, column.accessor)
                      }
                    />
                  </th>
                );
              }
            })}
          </tr>
        </thead>
        <tbody>
          {calculatedRows.map((doc) => {
            return (
              <tr key={doc.id}>
                {columns.map((column) => {
                  if (column.accessor === "stocked") {
                    return (
                      <td key={column.accessor}>
                        <input
                          type="checkbox"
                          checked={doc[column.accessor]}
                          value={doc[column.accessor]}
                          readOnly={true}
                        />
                      </td>
                    );
                  }
                  return <td key={column.accessor}>{doc[column.accessor]}</td>;
                })}
                <td>
                  <button onClick={() => deleteProduct(doc.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      Add new product
      <form>
        <div>
          <div>
            <input
              type="text"
              placeholder="Name"
              onChange={onValueChange}
              value={formObject.name}
              name="name"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Category"
              onChange={onValueChange}
              value={formObject.category}
              name="category"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Price"
              onChange={onValueChange}
              value={formObject.price}
              name="price"
            />
          </div>
          <div>
            <input
              type="checkbox"
              onChange={onChangeStocked}
              value={formObject.stocked}
              checked={formObject.stocked}
              name="stocked"
            />
          </div>
          <div>
            <input
              type="submit"
              onClick={onFormSubmit}
              className="btn btn-success"
            />
          </div>
        </div>
      </form>
    </>
  );
}
export default Products;
