<?php

session_start();
if (!isset($_SESSION['user_id'])) die();

const MYSQL_SERVER = '127.0.0.1';
const MYSQL_USER = 'money';
const MYSQL_PSWD = 'Gg44gG77';
const MYSQL_DB = 'scopetrack';

if(isset($_GET['qtype']) == false) die('no qtype');

switch ($_GET['qtype']) {
    case "similar":
        if(isset($_GET['amt'])
            && isset($_GET['exp_or_inc'])
            && is_numeric($_GET['amt'])
            && ($_GET['exp_or_inc'] == 'exp' || $_GET['exp_or_inc'] == 'inc')
        ) {
            print similar_transactions($_GET['exp_or_inc'],
                floatval($_GET['amt']));
        }
        break;
    case "new_transaction":
        print new_transaction($_POST['amount'], $_POST['category'], $_POST['date']);
        break;
    case "trans_cat":
        if (isset($_GET['exp_or_inc'])) {
            print get_transactions_categories($_GET['exp_or_inc']);
        }
        break;
    case "confirm_transaction":
        if(isset($_POST['transaction_id'])
            && isset($_POST['unconfirm'])
            && isset($_POST['exp_or_inc'])
            && ($_POST['exp_or_inc'] == 'exp' || $_POST['exp_or_inc'] == 'inc')
        ) {
            print confirm_transaction(
                $_POST['exp_or_inc'],
                $_POST['transaction_id'],
                $_POST['unconfirm']
            );
        }
        break;
    default:
        echo "no qtype";
}

function confirm_transaction($exp_or_inc, $transaction_id, $unconfirm) {
    $transaction_id = (int)$transaction_id;
    if($transaction_id > 0) {
        $mysqli = new mysqli(MYSQL_SERVER, MYSQL_USER, MYSQL_PSWD, MYSQL_DB);
        if (mysqli_connect_errno())
            die('Failed to connect to MySQL: ' . mysqli_connect_error());

        if ($exp_or_inc == 'exp') {
            $sql = sprintf('
                UPDATE spending SET spending_confirmed = %s
                WHERE spending_id = ?;
            ', $unconfirm == 'true' ? '0' : '1');
        } else {
            $sql = sprintf('
                UPDATE income SET income_confirmed = %s
                WHERE income_id = ?;
            ', $unconfirm == 'true' ? '0' : '1');
        }

        $stmt = $mysqli->prepare($sql);
        if ($mysqli->errno)
            die('MySQL Error: ' . mysqli_error($mysqli) .
                " Error Code: " . $mysqli->errno);
        $stmt->bind_param('i', $transaction_id);
        if ($mysqli->errno)
            die('MySQL Error: ' . mysqli_error($mysqli) .
                " Error Code: " . $mysqli->errno);
        $stmt->execute();
        $stmt->close();
        $mysqli->close();
        return 'ok';
    } else {
        return 'invalid';
    }
}

function new_transaction($amount, $category_id, $date) {
    $amount = (float)$amount;
    $category_id = (int)$category_id;

    if($amount > 0) {
        $parsed_date = date_parse($date);
        if(count($parsed_date['errors']) > 0) {
            return 'invalid';
        } else if (is_valid_category_id($category_id)) {
            if (save_verified_transaction($amount, $category_id, $date))
                return 'ok';
            else
                return 'invalid';
        } else {
            return 'invalid';
        }
    } else {
        return 'invalid';
    }
}

function save_verified_transaction($amount, $category_id, $date) {
    $mysqli = new mysqli(MYSQL_SERVER, MYSQL_USER, MYSQL_PSWD, MYSQL_DB);
    if (mysqli_connect_errno())
        die('Failed to connect to MySQL: ' . mysqli_connect_error());

    $stmt = $mysqli->prepare('
        INSERT INTO spending (spending_subcategory_id, spending_date,
            spending_amount, spending_confirmed) VALUES (?, ?, ?, 0);
    ');
    if ($mysqli->errno)
        die('MySQL Error: ' . mysqli_error($mysqli) .
            " Error Code: " . $mysqli->errno);
    $stmt->bind_param('isd', $category_id, $date, $amount);
    if ($mysqli->errno)
        die('MySQL Error: ' . mysqli_error($mysqli) .
            " Error Code: " . $mysqli->errno);
    $stmt->execute();
    if ($stmt->affected_rows == 1) {
        $saved = true;
    } else {
        $saved = false;
    }
    $stmt->close();
    $mysqli->close();

    return $saved;
}

function is_valid_category_id($category_id) {
    $mysqli = new mysqli(MYSQL_SERVER, MYSQL_USER, MYSQL_PSWD, MYSQL_DB);
    if (mysqli_connect_errno())
        die('Failed to connect to MySQL: ' . mysqli_connect_error());

    $stmt = $mysqli->prepare('
        SELECT
            COUNT(1) cnt
        FROM
            spending_category c
            JOIN spending_subcategory sc
                ON sc.category_id = c.category_id
        WHERE 
            c.category_user_id = ?
            AND sc.subcategory_id = ?;
    ');
    $stmt->bind_param('ii', $_SESSION['user_id'], $category_id);
    if ($mysqli->errno)
        die('MySQL Error: ' . mysqli_error($mysqli) .
            " Error Code: " . $mysqli->errno);
    $stmt->execute();
    $stmt->bind_result($cnt);
    $stmt->fetch();
    $stmt->close();
    $mysqli->close();
    if($cnt == 1)
        return true;
    else
        return false;
}

function similar_transactions($exp_or_inc, $transaction_amount) {
    $mysqli = new mysqli(MYSQL_SERVER, MYSQL_USER, MYSQL_PSWD, MYSQL_DB);
    if (mysqli_connect_errno())
        die('Failed to connect to MySQL: ' . mysqli_connect_error());

    if ($exp_or_inc == 'exp') {
        $sql = '
            SELECT
                s.spending_id,
                s.spending_date,
                c.category_display_name,
                CASE
                    WHEN c.category_display_name = sc.subcategory_display_name
                    THEN "-"
                    ELSE sc.subcategory_display_name
                END subcategory_display_name,
                s.spending_amount,
                s.spending_confirmed
            FROM
                spending s
                JOIN spending_subcategory sc
                    ON s.spending_subcategory_id = sc.subcategory_id
                JOIN spending_category c
                    ON sc.category_id = c.category_id
            WHERE
                s.spending_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                AND c.category_user_id = ?
                AND s.spending_amount = ?
            ORDER BY
                s.spending_date DESC;
        ';
    } else {
        $sql = '
            SELECT
                i.income_id,
                i.income_date,
                ic.category_display_name,
                i.income_amount,
                i.income_confirmed
            FROM
                income i
                JOIN income_category ic
                    ON i.income_category_id = ic.category_id
            WHERE
                i.income_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                AND ic.category_user_id = ?
                AND i.income_amount = ?
            ORDER BY
                i.income_date DESC;
        ';
    }

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('id', $_SESSION['user_id'], $transaction_amount);
    if ($mysqli->errno)
        die('MySQL Error: ' . mysqli_error($mysqli) .
            " Error Code: " . $mysqli->errno);

    $stmt->execute();
    $return = '';
    if ($exp_or_inc == 'exp') {
        $stmt->bind_result(
            $spending_id,
            $spending_date,
            $category_display_name,
            $subcategory_display_name,
            $spending_amount,
            $spending_confirmed
        );

        while($stmt->fetch()) {
            $return = $return .
                $spending_id . '\t' .
                $spending_date . '\t' .
                $category_display_name . '\t' .
                $subcategory_display_name . '\t' .
                $spending_amount . '\t' .
                $spending_confirmed . '\n';
        }
    } else {
        $stmt->bind_result(
            $spending_id,
            $spending_date,
            $category_display_name,
            $spending_amount,
            $spending_confirmed
        );

        while($stmt->fetch()) {
            $return = $return .
                $spending_id . '\t' .
                $spending_date . '\t' .
                $category_display_name . '\t' .
                $spending_amount . '\t' .
                $spending_confirmed . '\n';
        }
    }

    $stmt->close();
    $mysqli->close();

    return $return;
}

function get_transactions_categories($exp_or_inc) {
    if ($exp_or_inc != 'exp' && $exp_or_inc != 'inc') return '';

    if ($exp_or_inc == 'exp') {
        $sql = '
            SELECT
                sc.subcategory_id,
                sc.subcategory_display_name,
                c.category_display_name
            FROM
                spending_subcategory sc
                INNER JOIN
                spending_category c
                    ON sc.category_id = c.category_id
            WHERE
                c.category_user_id = ?;
        ';
    } else if ($exp_or_inc == 'inc') {
        $sql = '
            SELECT
                category_id,
                category_display_name
            FROM
                income_category
            WHERE
                category_user_id = ?;
        ';
    } else {
        return '';
    }

    $mysqli = new mysqli(MYSQL_SERVER, MYSQL_USER, MYSQL_PSWD, MYSQL_DB);
    if (mysqli_connect_errno())
        die('Failed to connect to MySQL: ' . mysqli_connect_error());
     
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $_SESSION['user_id']);
    if ($mysqli->errno)
        die('MySQL Error: ' . mysqli_error($mysqli) .
            " Error Code: " . $mysqli->errno);

    $stmt->execute();
    $return = '';

    if ($exp_or_inc == 'exp') {
        $stmt->bind_result(
            $subcategory_id,
            $subcategory_display_name,
            $category_display_name
        );

        while($stmt->fetch()) {
            $return = $return .
                $subcategory_id . '\t' .
                $subcategory_display_name . '\t' .
                $category_display_name . '\n';
        }
    } else {
        $stmt->bind_result(
            $category_id,
            $category_display_name
        );

        while($stmt->fetch()) {
            $return = $return .
                $category_id . '\t' .
                $category_display_name . '\n';
        }
    }

    $stmt->close();
    $mysqli->close();

    return $return;
}
